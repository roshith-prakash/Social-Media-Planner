import AgentOrchestrator from "../agents/AgentOrchestrator.js";
import VideoRepository from "../repositories/VideoRepository.js";
import AnalysisRepository from "../repositories/AnalysisRepository.js";
import UserRepository from "../repositories/UserRepository.js";
import { AppError } from "../utils/apiResponse.js";
import prisma from "../config/prisma.js";
import { emit } from "../utils/sseEmitter.js";
import { redisGet, redisSet } from "../config/redis.js";

const orchestrator = new AgentOrchestrator();

/**
 * AnalysisService — Business logic layer for the full AI analysis pipeline.
 *
 * 1. Checks MongoDB TTL AnalysisCache for existing results on this video
 * 2. Marks the video project as "analyzing"
 * 3. Runs the AgentOrchestrator with real-time SSE progress
 * 4. Caches results in AnalysisCache with 7-day TTL
 * 5. Saves results to VideoAnalysis collection
 * 6. Links analysis to VideoProject
 * 7. Increments user's total analysis count
 */
class AnalysisService {
  async runFullAnalysis(projectId, userId, cloudinaryUrl, userHints = {}) {
    // Mark project as analyzing
    await VideoRepository.updateStatus(projectId, "analyzing");

    try {
      const project = await VideoRepository.findById(projectId);
      const publicId = project?.cloudinaryPublicId;

      // ── Step 1: Multi-Tier Cache Check (L1 Redis -> L2 MongoDB) ─────────
      if (publicId) {
        let cachedData = null;
        let cacheSource = null;

        // 1a. Check L1: Redis
        try {
          const l1Data = await redisGet(`analysis:${publicId}`);
          if (l1Data) {
            cachedData = l1Data;
            cacheSource = "L1_Redis";
            console.log(`⚡ [L1 Redis Cache Hit] Returning cached analysis for ${publicId}`);
          }
        } catch (l1Err) {
          console.warn("[Redis L1] Cache lookup warning:", l1Err.message);
        }

        // 1b. Check L2: MongoDB Atlas (if L1 missed)
        if (!cachedData) {
          try {
            const cached = await prisma.analysisCache.findUnique({
              where: { cloudinaryPublicId: publicId },
            });

            if (cached && new Date(cached.expiresAt) > new Date()) {
              cachedData = cached.results || {};
              cacheSource = "L2_MongoDB";
              console.log(`⚡ [L2 MongoDB Cache Hit] Returning cached analysis for ${publicId}`);

              // Backfill Redis L1 cache (7 days TTL)
              await redisSet(`analysis:${publicId}`, cachedData, 7 * 24 * 60 * 60);
            }
          } catch (l2Err) {
            console.warn("[MongoDB L2] Cache lookup skipped:", l2Err.message);
          }
        }

        // 1c. If cache hit (either L1 or L2)
        if (cachedData) {
          emit(projectId, "cache_hit", {
            source: cacheSource,
            message: `Retrieved analysis from ${cacheSource} cache`,
          });
          emit(projectId, "complete", { success: true, processingTimeMs: 0 });

          const analysis = await AnalysisRepository.create({
            projectId,
            userId,
            videoAnalysis: cachedData.videoAnalysis ?? undefined,
            audienceAnalysis: cachedData.audienceAnalysis ?? undefined,
            platformRecommendations: cachedData.platformRecommendations ?? undefined,
            seoData: cachedData.seoData ?? undefined,
            generatedContent: cachedData.generatedContent ?? undefined,
            qualityReview: cachedData.qualityReview ?? undefined,
            strategy: cachedData.strategy ?? undefined,
            processingTimeMs: cachedData.processingTimeMs || 0,
            geminiModel: cachedData.geminiModel || "gemini-2.5-flash",
            agentErrors: cachedData.agentErrors?.length > 0 ? cachedData.agentErrors : undefined,
          });

          await VideoRepository.linkAnalysis(projectId, analysis.id);
          await UserRepository.incrementAnalysisCount(userId);
          return analysis;
        }
      }

      // ── Step 2: Run all 7 agents with SSE streaming ────────────────────────
      const results = await orchestrator.orchestrate(cloudinaryUrl, userHints, projectId);

      // ── Step 3: Populate Multi-Tier Cache (L1 Redis + L2 MongoDB) ──────────
      if (publicId) {
        // L1: Redis (7-day TTL)
        try {
          await redisSet(`analysis:${publicId}`, results, 7 * 24 * 60 * 60);
        } catch (l1SaveErr) {
          console.warn("[Redis L1] Cache save warning:", l1SaveErr.message);
        }

        // L2: MongoDB Atlas (7-day TTL)
        try {
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await prisma.analysisCache.upsert({
            where: { cloudinaryPublicId: publicId },
            update: { results, expiresAt },
            create: { cloudinaryPublicId: publicId, results, expiresAt },
          });
        } catch (l2SaveErr) {
          console.warn("[MongoDB L2] Cache save skipped:", l2SaveErr.message);
        }
      }

      // ── Step 4: Save the analysis document ─────────────────────────────────
      const analysis = await AnalysisRepository.create({
        projectId,
        userId,
        videoAnalysis: results.videoAnalysis ?? undefined,
        audienceAnalysis: results.audienceAnalysis ?? undefined,
        platformRecommendations: results.platformRecommendations ?? undefined,
        seoData: results.seoData ?? undefined,
        generatedContent: results.generatedContent ?? undefined,
        qualityReview: results.qualityReview ?? undefined,
        strategy: results.strategy ?? undefined,
        processingTimeMs: results.processingTimeMs,
        geminiModel: results.geminiModel,
        agentErrors: results.agentErrors.length > 0 ? results.agentErrors : undefined,
      });

      // Link analysis to project and mark completed
      await VideoRepository.linkAnalysis(projectId, analysis.id);

      // Increment user's analysis count
      await UserRepository.incrementAnalysisCount(userId);

      return analysis;
    } catch (error) {
      // Mark project as failed
      await VideoRepository.updateStatus(projectId, "failed", error.message);
      emit(projectId, "complete", { success: false, error: error.message });
      throw new AppError(`Analysis pipeline failed: ${error.message}`, 500);
    }
  }


  async regenerateAgent(analysisId, agentName, userId) {
    const analysis = await AnalysisRepository.findById(analysisId);
    if (!analysis) throw new AppError("Analysis not found", 404);
    if (analysis.userId !== userId) throw new AppError("Unauthorized", 403);

    const project = await VideoRepository.findById(analysis.projectId);
    if (!project) throw new AppError("Project not found", 404);

    // Build context from existing analysis
    const context = {
      videoAnalysis: analysis.videoAnalysis,
      audienceAnalysis: analysis.audienceAnalysis,
      platformRecommendations: analysis.platformRecommendations,
      seoData: analysis.seoData,
      generatedContent: analysis.generatedContent,
      qualityReview: analysis.qualityReview,
    };

    // Map agent name → agent instance and Prisma field name
    const agentMap = {
      content: { agent: orchestrator.contentAgent, field: "generatedContent" },
      quality: { agent: orchestrator.qualityAgent, field: "qualityReview" },
      strategy: { agent: orchestrator.strategyAgent, field: "strategy" },
      seo: { agent: orchestrator.seoAgent, field: "seoData" },
      platform: { agent: orchestrator.platformAgent, field: "platformRecommendations" },
    };

    const entry = agentMap[agentName];
    if (!entry) throw new AppError(`Unknown agent: ${agentName}`, 400);

    const newResult = await entry.agent.run(null, context);
    await AnalysisRepository.updateAgentOutput(analysisId, entry.field, newResult);

    return { field: entry.field, data: newResult };
  }
}

export default new AnalysisService();
