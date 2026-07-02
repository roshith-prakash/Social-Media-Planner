import BaseAgent from "./BaseAgent.js";

/**
 * QualityAgent — Phase 3 (after ContentAgent)
 *
 * Reviews the generated content across all platforms and scores it.
 * Provides specific improvement suggestions.
 */
class QualityAgent extends BaseAgent {
  constructor() {
    super("QualityAgent");
    this.needsVideo = false;
  }

  buildPrompt(context) {
    const gc = context.generatedContent || {};
    const va = context.videoAnalysis || {};
    const seo = context.seoData || {};

    return `
You are a senior content quality reviewer. Review the generated social media content below and score each dimension.

TARGET TOPIC: ${va.topic || "N/A"}
PRIMARY KEYWORDS: ${(seo.primaryKeywords || []).join(", ")}

GENERATED CONTENT TO REVIEW:
${JSON.stringify(gc, null, 2)}

Score each dimension from 0-100 and provide specific improvement suggestions.

Return a JSON object with EXACTLY this structure:

{
  "overallScore": 84,
  "verdict": "Ready to publish | Needs minor improvements | Needs significant revision",
  "checks": {
    "grammar": 95,
    "readability": 88,
    "seoAlignment": 82,
    "engagementPotential": 79,
    "platformSuitability": 91,
    "clickability": 76,
    "authenticity": 83,
    "ctaStrength": 80
  },
  "platformScores": {
    "youtube": 87,
    "linkedin": 82,
    "x": 79
  },
  "suggestions": [
    "Specific improvement suggestion 1 (which platform, what to change, why)",
    "Specific improvement suggestion 2",
    "Specific improvement suggestion 3"
  ],
  "bestTitle": "The specific YouTube title you recommend most highly and why in one sentence",
  "strongestContent": "youtube | linkedin | x — which platform's content is strongest and why",
  "approvedForPublishing": true,
  "reviewSummary": "2-3 sentence overall assessment of content quality"
}

Return ONLY valid JSON, no commentary outside the JSON object.
`;
  }
}

export default QualityAgent;
