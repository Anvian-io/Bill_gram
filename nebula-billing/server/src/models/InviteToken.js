import mongoose from "mongoose";

const inviteTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    createdByEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedByEmail: {
      type: String,
      default: null,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const InviteToken = mongoose.model("InviteToken", inviteTokenSchema);
