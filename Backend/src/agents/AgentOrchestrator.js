import ai, { GEMINI_MODEL } from "../config/gemini.js";
import VideoAnalysisAgent from "./VideoAnalysisAgent.js";
import AudienceAgent from "./AudienceAgent.js";
import PlatformAgent from "./PlatformAgent.js";
import SEOAgent from "./SEOAgent.js";
import ContentAgent from "./ContentAgent.js";
import QualityAgent from "./QualityAgent.js";
import StrategyAgent from "./StrategyAgent.js";
import fetch from "node-fetch";

/**
 * AgentOrchestrator — Coordinates all 7 AI agents.
 *
 * Execution pipeline:
 *  Phase 1 (parallel):  VideoAnalysisAgent + AudienceAgent (both watch video)
 *  Phase 2 (parallel):  PlatformAgent + SEOAgent (use Phase 1 context)
 *  Phase 3 (sequential): ContentAgent → QualityAgent (content generation + review)
 *  Phase 4 (sequential): StrategyAgent (final synthesis)
 *
 * The video is uploaded to Gemini's File API once and reused across agents.
 * Failed agents return null and are recorded in agentErrors — they do NOT
 * crash the entire pipeline.
 */
class AgentOrchestrator {
  constructor() {
    this.videoAnalysisAgent = new VideoAnalysisAgent();
    this.audienceAgent = new AudienceAgent();
    this.platformAgent = new PlatformAgent();
    this.seoAgent = new SEOAgent();
    this.contentAgent = new ContentAgent();
    this.qualityAgent = new QualityAgent();
    this.strategyAgent = new StrategyAgent();
  }

  /**
   * Upload a video from a Cloudinary URL to Gemini File API.
   * The file is temporary (auto-deleted by Google after 48 hours).
   */
  async uploadVideoToGemini(cloudinaryUrl) {
    console.log("📤 Uploading video to Gemini File API...");

    // Stream the video from Cloudinary into a buffer
    const response = await fetch(cloudinaryUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video from Cloudinary: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload as a Blob-like object using Gemini File API
    const blob = new Blob([buffer], { type: "video/mp4" });

    const uploadResult = await ai.files.upload({
      file: blob,
      config: { mimeType: "video/mp4", displayName: "analysis-video" },
    });

    // Poll until processing is complete
    let file = uploadResult;
    let attempts = 0;
    const maxAttempts = 30; // 2.5 minutes max

    while (file.state === "PROCESSING" && attempts < maxAttempts) {
      console.log(`⏳ Gemini processing video... (attempt ${attempts + 1})`);
      await new Promise((r) => setTimeout(r, 5000));
      file = await ai.files.get({ name: file.name });
      attempts++;
    }

    if (file.state !== "ACTIVE") {
      throw new Error(`Gemini File API processing failed. State: ${file.state}`);
    }

    console.log(`✅ Video uploaded to Gemini. URI: ${file.uri}`);
    return file.uri;
  }

  /**
   * Run a single agent safely — catches errors without crashing the pipeline.
   */
  async runAgent(agent, videoUri, context, agentErrors) {
    try {
      return await agent.run(videoUri, context);
    } catch (error) {
      console.error(`⚠️  ${agent.name} failed (non-fatal):`, error.message);
      agentErrors.push({ agent: agent.name, error: error.message });
      return null;
    }
  }

  /**
   * Main orchestration pipeline.
   * @param {string} cloudinaryUrl - Secure Cloudinary video URL
   * @param {object} userHints - Optional user-provided metadata (title, niche, brandVoice)
   * @returns {object} - Complete analysis object
   */
  async orchestrate(cloudinaryUrl, userHints = {}) {
    const startTime = Date.now();
    const agentErrors = [];
    const context = { userHints };

    // ── Upload video to Gemini File API ────────────────────────────────────
    const videoUri = await this.uploadVideoToGemini(cloudinaryUrl);

    // ── Phase 1: Parallel — Video Understanding ────────────────────────────
    console.log("\n🔍 Phase 1: Video Understanding (parallel)");
    const [videoAnalysis, audienceAnalysis] = await Promise.all([
      this.runAgent(this.videoAnalysisAgent, videoUri, context, agentErrors),
      this.runAgent(this.audienceAgent, videoUri, context, agentErrors),
    ]);

    context.videoAnalysis = videoAnalysis;
    context.audienceAnalysis = audienceAnalysis;

    // ── Phase 2: Parallel — Strategy ──────────────────────────────────────
    console.log("\n🎯 Phase 2: Strategy (parallel)");
    const [platformRecommendations, seoData] = await Promise.all([
      this.runAgent(this.platformAgent, null, context, agentErrors),
      this.runAgent(this.seoAgent, null, context, agentErrors),
    ]);

    context.platformRecommendations = platformRecommendations;
    context.seoData = seoData;

    // ── Phase 3: Sequential — Content Generation ───────────────────────────
    console.log("\n✍️  Phase 3: Content Generation");
    const generatedContent = await this.runAgent(
      this.contentAgent,
      null,
      context,
      agentErrors
    );
    context.generatedContent = generatedContent;

    // ── Phase 3b: Quality Review ───────────────────────────────────────────
    console.log("\n🔎 Phase 3b: Quality Review");
    const qualityReview = await this.runAgent(
      this.qualityAgent,
      null,
      context,
      agentErrors
    );
    context.qualityReview = qualityReview;

    // ── Phase 4: Strategy Synthesis ────────────────────────────────────────
    console.log("\n📊 Phase 4: Strategy Synthesis");
    const strategy = await this.runAgent(
      this.strategyAgent,
      null,
      context,
      agentErrors
    );

    const processingTimeMs = Date.now() - startTime;
    console.log(`\n🎉 Analysis complete in ${processingTimeMs}ms`);

    return {
      videoAnalysis,
      audienceAnalysis,
      platformRecommendations,
      seoData,
      generatedContent,
      qualityReview,
      strategy,
      processingTimeMs,
      geminiModel: GEMINI_MODEL,
      agentErrors,
    };
  }
}

export default AgentOrchestrator;
