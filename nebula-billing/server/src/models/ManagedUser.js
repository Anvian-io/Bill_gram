import mongoose from "mongoose";

const managedUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    registeredBy: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    inviteToken: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const ManagedUser = mongoose.model("ManagedUser", managedUserSchema);
