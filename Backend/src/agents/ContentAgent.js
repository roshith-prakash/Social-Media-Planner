import BaseAgent from "./BaseAgent.js";

/**
 * ContentAgent — Phase 3
 *
 * Generates platform-optimized content for YouTube, LinkedIn, and X.
 * Each platform gets multiple tone variations:
 * professional, seo-focused, curiosity-driven, minimal, click-worthy.
 */
class ContentAgent extends BaseAgent {
  constructor() {
    super("ContentAgent");
    this.needsVideo = false;
  }

  buildPrompt(context) {
    const va = context.videoAnalysis || {};
    const aa = context.audienceAnalysis || {};
    const platforms = context.platformRecommendations || [];
    const seo = context.seoData || {};
    const userHints = context.userHints || {};

    const topPlatform = platforms[0]?.platform || "youtube";
    const brandVoice = userHints.brandVoice || "professional";

    return `
You are an elite social media content strategist and copywriter. 
Generate highly optimized, platform-specific content for all three platforms.

VIDEO INTELLIGENCE:
- Topic: ${va.topic}
- Summary: ${va.summary}
- Category: ${va.category}
- Tone: ${va.tone}
- Content type: ${va.contentType}
- Transcript excerpt: ${(va.transcript || "").substring(0, 1000)}
- Keywords: ${(va.keywords || []).join(", ")}
- Hook: ${va.hookAnalysis?.hookText || "N/A"}

AUDIENCE:
- Primary: ${aa.primaryAudience}
- Intent: ${aa.intent}
- Skill level: ${aa.skillLevel}
- Age range: ${aa.ageRange}

SEO DATA:
- Primary keywords: ${(seo.primaryKeywords || []).join(", ")}
- Secondary keywords: ${(seo.secondaryKeywords || []).join(", ")}
- Long tail: ${(seo.longTailKeywords || []).join(", ")}

BEST PLATFORM: ${topPlatform}
CREATOR BRAND VOICE: ${brandVoice}

Generate content in EXACTLY this JSON structure:

{
  "youtube": {
    "titles": [
      { "text": "SEO-optimized title", "tone": "seo", "reasoning": "Why this title ranks well" },
      { "text": "Curiosity-driven title", "tone": "curiosity", "reasoning": "Why this creates clicks" },
      { "text": "Professional title", "tone": "professional", "reasoning": "Suits B2B sharing" },
      { "text": "Click-worthy title", "tone": "clickworthy", "reasoning": "High CTR potential" },
      { "text": "Minimal clear title", "tone": "minimal", "reasoning": "Clear value proposition" }
    ],
    "description": "Full 3-4 paragraph YouTube description with natural keyword integration, value proposition, and CTA. Include timestamps placeholder if relevant.",
    "chapters": [
      { "time": "0:00", "title": "Introduction" },
      { "time": "1:30", "title": "Chapter 2 title" }
    ],
    "tags": ["tag1", "tag2", "...15-20 tags optimized for YouTube search"],
    "hashtags": {
      "broad": ["#Technology", "#Learning"],
      "medium": ["#WebDevelopment", "#Coding"],
      "niche": ["#ReactJS", "#FrontendDev"],
      "trending": ["#AITools", "#2025"],
      "community": ["#DevCommunity", "#100DaysOfCode"]
    },
    "thumbnailSuggestions": {
      "text": "Bold thumbnail text overlay e.g. 'THE TRUTH ABOUT...'",
      "colorScheme": "e.g. Dark background with yellow accent",
      "layout": "e.g. Left: text, Right: person reacting",
      "visualConcept": "Detailed visual description",
      "composition": "e.g. Rule of thirds, close-up face with shocked expression"
    },
    "cta": "Subscribe CTA text for end screen / pinned comment"
  },
  "linkedin": {
    "hook": "First line that stops the scroll (no hashtags, pure hook)",
    "post": "Full LinkedIn post (150-300 words). Professional tone. Uses line breaks for readability. Tells a story or shares an insight. Ends with a question.",
    "cta": "Clear call to action e.g. 'What would you add? Drop it below 👇'",
    "hashtags": ["#hashtag1", "#hashtag2", "...5-8 LinkedIn hashtags"],
    "variations": [
      { "tone": "storytelling", "content": "Alternative full post using storytelling format" },
      { "tone": "listicle", "content": "Alternative post using numbered list format" },
      { "tone": "controversial", "content": "Alternative post with a bold/contrarian take to spark debate" }
    ]
  },
  "x": {
    "tweet": "Single tweet under 280 characters. Punchy, opinionated, or insightful.",
    "thread": [
      "Tweet 1: Hook — statement or question that demands attention",
      "Tweet 2: Point 1 with context",
      "Tweet 3: Point 2 with example",
      "Tweet 4: Point 3 with data or insight",
      "Tweet 5: Summary + CTA"
    ],
    "cta": "Follow/retweet CTA",
    "hashtags": ["#hashtag1", "#hashtag2", "...3-5 X hashtags"],
    "variations": [
      { "tone": "educational", "content": "Alternative single tweet: educational angle" },
      { "tone": "opinionated", "content": "Alternative single tweet: bold opinion" },
      { "tone": "question", "content": "Alternative single tweet: engaging question" }
    ]
  }
}

Rules:
- Every piece of content must feel NATIVE to its platform
- YouTube titles must include the primary keyword naturally
- LinkedIn posts must NOT feel like marketing copy — they should feel human
- X tweets must be under 280 characters
- Return ONLY valid JSON, no commentary outside the JSON object
`;
  }
}

export default ContentAgent;
