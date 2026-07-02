import mongoose from "mongoose";

const hookAnalysisSchema = new mongoose.Schema({
  hookText: String,
  hookQuality: { type: String, enum: ["strong", "moderate", "weak"] },
  retentionPrediction: String,
  improvements: [String],
}, { _id: false });

const videoQualityIssueSchema = new mongoose.Schema({
  issue: String,
  severity: { type: String, enum: ["critical", "moderate", "minor"] },
  suggestion: String,
}, { _id: false });

const videoAnalysisDataSchema = new mongoose.Schema({
  transcript: { type: String, default: "" },
  summary: String,
  topic: String,
  category: String,
  niche: String,
  language: String,
  tone: String,
  contentType: String, // tutorial, vlog, review, educational, entertainment
  keywords: [String],
  hookAnalysis: hookAnalysisSchema,
  videoQualityIssues: [videoQualityIssueSchema],
}, { _id: false });

const audienceAnalysisSchema = new mongoose.Schema({
  primaryAudience: String,
  ageRange: String,
  skillLevel: { type: String, enum: ["beginner", "intermediate", "advanced", "mixed"] },
  interests: [String],
  audienceType: [String],
  intent: String,
}, { _id: false });

const platformRecommendationSchema = new mongoose.Schema({
  platform: String,
  score: Number,
  confidence: Number,
  rank: Number,
  justification: String,
  pros: [String],
  cons: [String],
  contentFormat: String,
}, { _id: false });

const seoDataSchema = new mongoose.Schema({
  primaryKeywords: [String],
  secondaryKeywords: [String],
  searchIntent: String,
  seoScore: Number,
  rankingSuggestions: [String],
  opportunities: [String],
}, { _id: false });

const titleVariationSchema = new mongoose.Schema({
  text: String,
  tone: String,
  reasoning: String,
}, { _id: false });

const hashtagsSchema = new mongoose.Schema({
  broad: [String],
  medium: [String],
  niche: [String],
  trending: [String],
  community: [String],
}, { _id: false });

const thumbnailSuggestionSchema = new mongoose.Schema({
  text: String,
  colorScheme: String,
  layout: String,
  visualConcept: String,
  composition: String,
}, { _id: false });

const chapterSchema = new mongoose.Schema({
  time: String,
  title: String,
}, { _id: false });

const contentVariationSchema = new mongoose.Schema({
  tone: String,
  content: String,
}, { _id: false });

const youtubeContentSchema = new mongoose.Schema({
  titles: [titleVariationSchema],
  description: String,
  chapters: [chapterSchema],
  tags: [String],
  hashtags: hashtagsSchema,
  thumbnailSuggestions: thumbnailSuggestionSchema,
  cta: String,
}, { _id: false });

const linkedinContentSchema = new mongoose.Schema({
  hook: String,
  post: String,
  cta: String,
  hashtags: [String],
  variations: [contentVariationSchema],
}, { _id: false });

const xContentSchema = new mongoose.Schema({
  tweet: String,
  thread: [String],
  cta: String,
  hashtags: [String],
  variations: [contentVariationSchema],
}, { _id: false });

const generatedContentSchema = new mongoose.Schema({
  youtube: youtubeContentSchema,
  linkedin: linkedinContentSchema,
  x: xContentSchema,
}, { _id: false });

const qualityCheckSchema = new mongoose.Schema({
  grammar: Number,
  readability: Number,
  seoAlignment: Number,
  engagementPotential: Number,
  platformSuitability: Number,
  clickability: Number,
}, { _id: false });

const qualityReviewSchema = new mongoose.Schema({
  overallScore: Number,
  checks: qualityCheckSchema,
  suggestions: [String],
  approvedForPublishing: Boolean,
}, { _id: false });

const postingScheduleSchema = new mongoose.Schema({
  platform: String,
  suggestedTime: String,
  reasoning: String,
}, { _id: false });

const scorecardSchema = new mongoose.Schema({
  platformFit: Number,
  seoScore: Number,
  engagementPotential: Number,
  professionalism: Number,
  readability: Number,
  viralityPotential: Number,
  overallReadiness: Number,
}, { _id: false });

const strategySchema = new mongoose.Schema({
  bestPlatform: String,
  publishingOrder: [String],
  postingSchedule: [postingScheduleSchema],
  contentImprovements: [String],
  scorecard: scorecardSchema,
}, { _id: false });

// ─── Main Document ────────────────────────────────────────────────────────────

const videoAnalysisSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VideoProject",
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    videoAnalysis: videoAnalysisDataSchema,
    audienceAnalysis: audienceAnalysisSchema,
    platformRecommendations: [platformRecommendationSchema],
    seoData: seoDataSchema,
    generatedContent: generatedContentSchema,
    qualityReview: qualityReviewSchema,
    strategy: strategySchema,
    processingTimeMs: { type: Number, default: 0 },
    geminiModel: { type: String, default: "gemini-2.5-flash" },
    agentErrors: [{ agent: String, error: String }],
  },
  {
    timestamps: true,
  }
);

const VideoAnalysis = mongoose.model("VideoAnalysis", videoAnalysisSchema);
export default VideoAnalysis;
