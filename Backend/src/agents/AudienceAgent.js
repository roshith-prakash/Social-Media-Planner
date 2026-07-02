import BaseAgent from "./BaseAgent.js";

/**
 * AudienceAgent — Phase 1 (parallel with VideoAnalysisAgent)
 *
 * Predicts the target audience based on video content:
 * demographics, skill level, interests, and viewer intent.
 */
class AudienceAgent extends BaseAgent {
  constructor() {
    super("AudienceAgent");
    this.needsVideo = true;
  }

  buildPrompt(context) {
    const va = context.videoAnalysis || {};

    return `
You are an expert audience researcher and social media strategist.

Based on the video provided and the following analysis context, predict the target audience in detail.

Video context:
- Topic: ${va.topic || "Unknown"}
- Category: ${va.category || "Unknown"}
- Tone: ${va.tone || "Unknown"}
- Content type: ${va.contentType || "Unknown"}
- Keywords: ${(va.keywords || []).join(", ") || "Unknown"}
- Transcript excerpt: ${(va.transcript || "").substring(0, 500)}

Return a JSON object with EXACTLY this structure:

{
  "primaryAudience": "Specific description of the main audience e.g. 'Junior software developers learning system design'",
  "ageRange": "e.g. 22-35",
  "gender": "e.g. Mixed | Predominantly Male | Predominantly Female",
  "educationLevel": "e.g. College-educated | Self-taught professionals | Students",
  "skillLevel": "beginner | intermediate | advanced | mixed",
  "interests": ["interest1", "interest2", "interest3", "...up to 8 interests"],
  "audienceType": ["professional", "educational", "creative", "general"],
  "intent": "Primary viewing intent: learn | entertain | solve problem | be inspired | stay updated | buy decision",
  "psychographics": "2-3 sentences describing the mindset, values, and motivations of this audience",
  "platforms": {
    "youtube": "Why this audience uses YouTube",
    "linkedin": "Why (or why not) this audience uses LinkedIn",
    "x": "Why (or why not) this audience uses X"
  },
  "painPoints": ["Pain point 1 this video addresses", "Pain point 2"],
  "contentExpectations": "What this audience expects from content like this"
}

Return ONLY valid JSON, no commentary outside the JSON object.
`;
  }
}

export default AudienceAgent;
