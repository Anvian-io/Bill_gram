import mongoose from "mongoose";
import { env } from "./env.js";

export const connectToDatabase = async () => {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is missing. Add it to server/.env before starting the server.");
  }

  await mongoose.connect(env.mongodbUri);
  console.log("MongoDB connected");
};
