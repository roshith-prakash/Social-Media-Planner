import BaseAgent from "./BaseAgent.js";

/**
 * PlatformAgent — Phase 2
 *
 * Ranks YouTube, LinkedIn, and X for the given video with:
 * scores, confidence, justification, pros, cons.
 * Designed to be extended with new platforms (Open/Closed Principle).
 */
class PlatformAgent extends BaseAgent {
  constructor() {
    super("PlatformAgent");
    this.needsVideo = false; // Works from accumulated context
    this.supportedPlatforms = ["youtube", "linkedin", "x"];
  }

  buildPrompt(context) {
    const va = context.videoAnalysis || {};
    const aa = context.audienceAnalysis || {};

    return `
You are a senior social media strategist with deep expertise in platform algorithms, audience behavior, and content performance.

Analyze the following video and audience data to rank the supported platforms.

VIDEO DATA:
- Topic: ${va.topic || "N/A"}
- Category: ${va.category || "N/A"}
- Content type: ${va.contentType || "N/A"}
- Tone: ${va.tone || "N/A"}
- Duration: ${va.estimatedDuration || "N/A"}
- Keywords: ${(va.keywords || []).slice(0, 10).join(", ")}
- Hook quality: ${va.hookAnalysis?.hookQuality || "N/A"}

AUDIENCE DATA:
- Primary audience: ${aa.primaryAudience || "N/A"}
- Skill level: ${aa.skillLevel || "N/A"}
- Intent: ${aa.intent || "N/A"}
- Age range: ${aa.ageRange || "N/A"}
- Audience type: ${(aa.audienceType || []).join(", ")}

SUPPORTED PLATFORMS: YouTube, LinkedIn, X

Return a JSON array (sorted by rank, rank 1 = best fit) with EXACTLY this structure:

[
  {
    "platform": "youtube",
    "rank": 1,
    "score": 92,
    "confidence": 88,
    "justification": "Detailed 2-3 sentence explanation of WHY this platform is the best/worst fit for this specific video",
    "pros": ["Specific pro 1", "Specific pro 2", "Specific pro 3"],
    "cons": ["Specific con 1", "Specific con 2"],
    "contentFormat": "How to format content for this platform e.g. landscape video, 10-20 min, chapters recommended",
    "bestPostingTime": "e.g. Tuesday-Thursday, 2-4 PM EST",
    "expectedReach": "e.g. High — educational tech content performs well in YouTube search"
  },
  {
    "platform": "linkedin",
    "rank": 2,
    ...
  },
  {
    "platform": "x",
    "rank": 3,
    ...
  }
]

Rules:
- score: 0-100 (platform fit score for this specific video)
- confidence: 0-100 (your confidence in this recommendation)
- All 3 platforms must be included
- Justification must explain the REASONING, not just repeat the score
- Return ONLY the JSON array, no commentary
`;
  }
}

export default PlatformAgent;
