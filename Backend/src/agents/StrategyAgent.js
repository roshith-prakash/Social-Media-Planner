import BaseAgent from "./BaseAgent.js";

/**
 * StrategyAgent — Phase 4 (final agent)
 *
 * Synthesizes all prior agent outputs into a complete publishing strategy
 * with scorecard, publishing order, schedule, and improvement recommendations.
 */
class StrategyAgent extends BaseAgent {
  constructor() {
    super("StrategyAgent");
    this.needsVideo = false;
  }

  buildPrompt(context) {
    const va = context.videoAnalysis || {};
    const aa = context.audienceAnalysis || {};
    const platforms = context.platformRecommendations || [];
    const seo = context.seoData || {};
    const qr = context.qualityReview || {};
    const gc = context.generatedContent || {};

    const rankedPlatforms = platforms
      .sort((a, b) => (a.rank || 99) - (b.rank || 99))
      .map((p) => `${p.rank}. ${p.platform} (score: ${p.score})`)
      .join(", ");

    return `
You are a senior social media growth strategist. Based on the complete analysis below, create a final publishing strategy.

VIDEO: ${va.topic} | ${va.contentType} | ${va.tone}
AUDIENCE: ${aa.primaryAudience} | Intent: ${aa.intent}
PLATFORM RANKING: ${rankedPlatforms}
SEO SCORE: ${seo.seoScore}/100
QUALITY SCORE: ${qr.overallScore}/100
QUALITY VERDICT: ${qr.verdict || "N/A"}
VIDEO ISSUES: ${(va.videoQualityIssues || []).map(i => i.issue).join(", ") || "None detected"}

Return a JSON object with EXACTLY this structure:

{
  "bestPlatform": "youtube | linkedin | x",
  "bestPlatformReasoning": "Why this is the #1 platform for this specific video in 2-3 sentences",
  "publishingOrder": ["youtube", "linkedin", "x"],
  "publishingOrderReasoning": "Why to publish in this order (timing, cross-promotion, algorithm behavior)",
  "postingSchedule": [
    {
      "platform": "youtube",
      "suggestedDay": "Tuesday or Thursday",
      "suggestedTime": "2:00 PM - 4:00 PM EST",
      "reasoning": "YouTube algorithm favors weekday afternoon uploads for this content type"
    },
    {
      "platform": "linkedin",
      "suggestedDay": "Wednesday",
      "suggestedTime": "8:00 AM - 10:00 AM EST",
      "reasoning": "LinkedIn professionals check feeds during morning commute"
    },
    {
      "platform": "x",
      "suggestedDay": "Same day as YouTube",
      "suggestedTime": "12:00 PM - 2:00 PM EST",
      "reasoning": "Drive cross-platform traffic by posting X tweet shortly after YouTube upload"
    }
  ],
  "contentImprovements": [
    "Before publishing: specific video improvement 1",
    "Before publishing: specific video improvement 2",
    "Optional: improvement that would increase reach by X%"
  ],
  "crossPromotionStrategy": "How to use each platform to drive traffic to the others",
  "scorecard": {
    "platformFit": 88,
    "seoScore": ${seo.seoScore || 75},
    "engagementPotential": 82,
    "professionalism": 85,
    "readability": 90,
    "viralityPotential": 70,
    "overallReadiness": 84
  },
  "scorecardExplanations": {
    "platformFit": "Why this score",
    "seoScore": "Why this score",
    "engagementPotential": "Why this score",
    "viralityPotential": "Why this score",
    "overallReadiness": "What needs to happen to reach 90+"
  },
  "keyTakeaways": [
    "Most important takeaway 1",
    "Most important takeaway 2",
    "Most important takeaway 3"
  ],
  "estimatedReach": {
    "youtube": "e.g. 500-2,000 views in first week (search-driven)",
    "linkedin": "e.g. 300-800 impressions (network-driven)",
    "x": "e.g. 50-200 impressions (hashtag-driven)"
  }
}

Return ONLY valid JSON, no commentary outside the JSON object.
`;
  }
}

export default StrategyAgent;
