import BaseAgent from "./BaseAgent.js";

/**
 * ContentAgent — Phase 3
 *
 * Generates platform-optimized content for YouTube and Instagram.
 * YouTube: SEO titles, descriptions, chapters, tags, hashtags, thumbnails.
 * Instagram: Reels scripts, 3-second visual/verbal hooks, captions, hashtags,
 * audio vibes, and carousel slide breakdowns.
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
Generate highly optimized, platform-specific content for YouTube and Instagram.

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
      { "text": "Professional title", "tone": "professional", "reasoning": "Suits industry sharing" },
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
  "instagram": {
    "hook": {
      "visualHook": "Exact visual action or on-screen text in seconds 0-3 that stops the scroll",
      "verbalHook": "Exact opening spoken sentence to hook the viewer immediately"
    },
    "caption": "Primary Instagram caption (150-250 words) with attention-grabbing first line, clean paragraph breaks, emojis, core takeaway, and engaging question to prompt comments.",
    "cta": "Clear call to action e.g. 'Save this Reel for later 🔖 and share with a friend!'",
    "reelsScript": [
      { "timestamp": "0:00 - 0:03", "section": "Hook", "script": "Spoken hook sentence", "onScreenText": "BOLD 3-WORD HOOK" },
      { "timestamp": "0:03 - 0:15", "section": "The Problem", "script": "Relatable problem setup", "onScreenText": "Key struggle" },
      { "timestamp": "0:15 - 0:45", "section": "The Solution / Demo", "script": "High-value actionable breakdown", "onScreenText": "Step-by-step pointers" },
      { "timestamp": "0:45 - 0:60", "section": "CTA", "script": "Wrap-up and follow prompt", "onScreenText": "Follow for more daily tips" }
    ],
    "hashtags": {
      "niche": ["#nicheTag1", "#nicheTag2"],
      "broad": ["#broadTag1", "#broadTag2"],
      "community": ["#communityTag1", "#communityTag2"]
    },
    "audioRecommendation": {
      "soundType": "Trending upbeat electronic / chill lofi beat",
      "pacing": "Fast-paced rhythm matching video cuts"
    },
    "carouselConcept": {
      "title": "5-slide educational carousel idea derived from this video",
      "slides": [
        "Slide 1: Hook / Title slide",
        "Slide 2: Insight 1",
        "Slide 3: Insight 2",
        "Slide 4: Insight 3",
        "Slide 5: Summary + Save & Share CTA"
      ]
    },
    "variations": [
      { "tone": "storytelling", "caption": "Alternative story-driven caption format" },
      { "tone": "actionable_tips", "caption": "Alternative numbered tip checklist caption" },
      { "tone": "contrarian", "caption": "Alternative bold/contrarian angle that sparks debate" }
    ]
  }
}

Rules:
- Every piece of content must feel NATIVE to its platform
- YouTube titles must include the primary keyword naturally
- Instagram captions must use spacing and emojis naturally, avoid dense blocks of text
- Return ONLY valid JSON, no commentary outside the JSON object
`;
  }
}

export default ContentAgent;
