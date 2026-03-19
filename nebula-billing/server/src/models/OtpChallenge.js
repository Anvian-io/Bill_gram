import mongoose from "mongoose";

const otpChallengeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    lastRequestedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export const OtpChallenge = mongoose.model("OtpChallenge", otpChallengeSchema);
