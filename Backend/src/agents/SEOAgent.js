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
You are a senior SEO specialist with expertise in video SEO, content discovery, and search algorithms across YouTube and Instagram.

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
    "Untapped SEO opportunity 1 e.g. Target beginner query for 2025/2026",
    "Opportunity 2"
  ],
  "avoidKeywords": ["oversaturated or irrelevant keyword to avoid"],
  "youtubeSpecific": {
    "searchVolume": "e.g. High | Medium | Low",
    "competitionLevel": "e.g. High | Medium | Low",
    "bestTagStrategy": "How to structure tags for this video"
  },
  "instagramSpecific": {
    "exploreAlgorithmTips": ["Caption keyword placement", "Audio keyword association"],
    "inAppSearchKeywords": ["Keywords users type into Instagram search"],
    "hashtagStrategy": "Optimal 3-5 hyper-relevant niche hashtags for Explore distribution"
  }
}

Return ONLY valid JSON, no commentary outside the JSON object.
`;
  }
}

export default SEOAgent;
