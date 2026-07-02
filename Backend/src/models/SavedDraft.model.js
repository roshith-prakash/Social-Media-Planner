import mongoose from "mongoose";

const savedDraftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VideoAnalysis",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VideoProject",
      required: true,
    },
    platform: {
      type: String,
      enum: ["youtube", "linkedin", "x"],
      required: true,
    },
    contentType: {
      type: String,
      // e.g. "title", "description", "tweet", "thread", "post", "hashtags"
      required: true,
    },
    label: {
      type: String,
      default: "",
    },
    originalContent: {
      type: String,
      default: "",
    },
    editedContent: {
      type: String,
      required: true,
    },
    isFavorited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

savedDraftSchema.index({ userId: 1, createdAt: -1 });

const SavedDraft = mongoose.model("SavedDraft", savedDraftSchema);
export default SavedDraft;
