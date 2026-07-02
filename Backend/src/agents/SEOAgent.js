import BaseAgent from "./BaseAgent.js";

/**
 * SEOAgent — Phase 2 (parallel with PlatformAgent)
 *
 * Generates comprehensive SEO intelligence:
 * keyword strategy, search intent, SEO score, ranking opportunities.
 */
class SEOAgent extends BaseAgent {
  constructor() {
    super("SEOAgent");
    this.needsVideo = false;
  }

  buildPrompt(context) {
    const va = context.videoAnalysis || {};
    const aa = context.audienceAnalysis || {};

    return `
You are a senior SEO specialist with expertise in video SEO, content discovery, and search algorithms across YouTube, LinkedIn, and X.

Analyze the content below and generate a comprehensive SEO strategy.

VIDEO CONTENT:
- Topic: ${va.topic || "N/A"}
- Category: ${va.category || "N/A"}
- Niche: ${va.niche || "N/A"}
- Keywords extracted: ${(va.keywords || []).join(", ")}
- Transcript excerpt: ${(va.transcript || "").substring(0, 800)}
- Content type: ${va.contentType || "N/A"}

AUDIENCE:
- Primary: ${aa.primaryAudience || "N/A"}
- Intent: ${aa.intent || "N/A"}
- Interests: ${(aa.interests || []).join(", ")}

Return a JSON object with EXACTLY this structure:

{
  "primaryKeywords": ["highest-volume keyword 1", "keyword 2", "keyword 3"],
  "secondaryKeywords": ["supporting keyword 1", "keyword 2", "...up to 10"],
  "longTailKeywords": ["long tail phrase 1", "long tail phrase 2", "...up to 5"],
  "searchIntent": "informational | navigational | transactional | commercial",
  "searchIntentExplanation": "Why this audience searches with this intent",
  "seoScore": 78,
  "seoScoreBreakdown": {
    "keywordStrength": 80,
    "contentDepth": 75,
    "searchVolumePotential": 70,
    "competitionLevel": 65
  },
  "rankingSuggestions": [
    "Specific suggestion to improve search ranking 1",
    "Specific suggestion 2",
    "Specific suggestion 3"
  ],
  "opportunities": [
    "Untapped SEO opportunity 1 e.g. Target 'X for beginners 2025'",
    "Opportunity 2"
  ],
  "avoidKeywords": ["oversaturated or irrelevant keyword to avoid"],
  "youtubeSpecific": {
    "searchVolume": "e.g. High | Medium | Low",
    "competitionLevel": "e.g. High | Medium | Low",
    "bestTagStrategy": "How to structure tags for this video"
  },
  "linkedinSpecific": {
    "discoveryMethod": "How LinkedIn users will find this content",
    "algorithmTips": ["LinkedIn-specific tip 1", "tip 2"]
  },
  "xSpecific": {
    "trendingPotential": "e.g. Medium — topic aligns with weekly tech discussions",
    "hashtagStrategy": "How to use hashtags on X for this content"
  }
}

Return ONLY valid JSON, no commentary outside the JSON object.
`;
  }
}

export default SEOAgent;
