import AgentOrchestrator from "../agents/AgentOrchestrator.js";
import VideoRepository from "../repositories/VideoRepository.js";
import AnalysisRepository from "../repositories/AnalysisRepository.js";
import UserRepository from "../repositories/UserRepository.js";
import { AppError } from "../utils/apiResponse.js";

const orchestrator = new AgentOrchestrator();

/**
 * AnalysisService — Business logic layer for the full AI analysis pipeline.
 *
 * 1. Marks the video project as "analyzing"
 * 2. Runs the AgentOrchestrator
 * 3. Saves results to VideoAnalysis collection
 * 4. Links analysis to VideoProject
 * 5. Increments user's total analysis count
 */
class AnalysisService {
  async runFullAnalysis(projectId, userId, cloudinaryUrl, userHints = {}) {
    // Mark project as analyzing
    await VideoRepository.updateStatus(projectId, "analyzing");

    try {
      // Run all 7 agents
      const results = await orchestrator.orchestrate(cloudinaryUrl, userHints);

      // Save the analysis document
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
