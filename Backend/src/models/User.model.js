import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUID: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    photoURL: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    niche: {
      type: String,
      default: "",
    },
    brandVoice: {
      type: String,
      enum: ["professional", "casual", "educational", "entertaining", "inspirational", ""],
      default: "",
    },
    preferredPlatforms: {
      type: [String],
      enum: ["youtube", "linkedin", "x"],
      default: [],
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    totalAnalyses: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
