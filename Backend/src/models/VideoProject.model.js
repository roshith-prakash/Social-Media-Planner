import mongoose from "mongoose";

const videoProjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: "Untitled Project",
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    format: {
      type: String,
      default: "mp4",
    },
    status: {
      type: String,
      enum: ["pending", "analyzing", "completed", "failed"],
      default: "pending",
    },
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VideoAnalysis",
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user project history queries
videoProjectSchema.index({ userId: 1, createdAt: -1 });

const VideoProject = mongoose.model("VideoProject", videoProjectSchema);
export default VideoProject;
