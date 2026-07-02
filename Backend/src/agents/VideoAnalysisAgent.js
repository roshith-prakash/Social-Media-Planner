import BaseAgent from "./BaseAgent.js";

/**
 * VideoAnalysisAgent — Phase 1
 *
 * Directly analyzes the uploaded video to extract:
 * transcript, topic, tone, category, niche, language, content type,
 * keywords, hook analysis, and video quality issues.
 */
class VideoAnalysisAgent extends BaseAgent {
  constructor() {
    super("VideoAnalysisAgent");
    this.needsVideo = true; // This agent requires direct video access
  }

  buildPrompt(context) {
    const userHints = context.userHints || {};

    return `
You are an expert video content analyst. Watch the provided video carefully and perform a deep analysis.

${userHints.title ? `User-provided title hint: "${userHints.title}"` : ""}
${userHints.niche ? `Creator's niche: "${userHints.niche}"` : ""}

Analyze the video and return a JSON object with EXACTLY this structure (no extra keys):

{
  "transcript": "Full transcript or detailed spoken content summary if transcript unavailable",
  "summary": "2-3 sentence summary of what this video is about",
  "topic": "Main topic in 3-8 words",
  "category": "e.g. Technology, Business, Education, Health, Entertainment, Lifestyle, Finance, Marketing",
  "niche": "Specific niche within the category, e.g. 'AI Tools for Developers'",
  "language": "Language spoken in the video, e.g. English",
  "tone": "e.g. Educational, Inspirational, Casual, Professional, Humorous, Serious",
  "contentType": "One of: tutorial | vlog | review | educational | entertainment | interview | documentary | promotional | storytelling",
  "keywords": ["keyword1", "keyword2", "keyword3", "...up to 15 keywords"],
  "estimatedDuration": "e.g. under 60s | 1-5 min | 5-15 min | 15-30 min | 30+ min",
  "hookAnalysis": {
    "hookText": "What happens in the first 5-10 seconds",
    "hookQuality": "strong | moderate | weak",
    "retentionPrediction": "e.g. High — strong opening question keeps viewers watching",
    "improvements": ["Specific improvement 1", "Specific improvement 2"]
  },
  "videoQualityIssues": [
    {
      "issue": "Issue name e.g. Long intro",
      "severity": "critical | moderate | minor",
      "suggestion": "Specific actionable fix"
    }
  ]
}

Rules:
- videoQualityIssues should be an empty array [] if the video is high quality
- Be specific and actionable in every field
- Return ONLY valid JSON, no commentary outside the JSON object
`;
  }
}

export default VideoAnalysisAgent;
