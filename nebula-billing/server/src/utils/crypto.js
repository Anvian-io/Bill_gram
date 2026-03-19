import crypto from "node:crypto";

export const hashValue = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

export const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

export const generateRandomToken = (prefix = "NBL", length = 18) => {
  const random = crypto.randomBytes(length).toString("hex").slice(0, length).toUpperCase();
  return `${prefix}-${random}`;
};
