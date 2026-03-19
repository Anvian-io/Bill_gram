import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverRoot = resolve(__dirname, "..", "..");

dotenv.config({ path: resolve(serverRoot, ".env") });

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const allowedEmailsRaw =
  process.env.USER_EMAIL ??
  process.env.USER_EMAILS ??
  process.env.User_email ??
  "";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseNumber(process.env.PORT, 5000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  mongodbUri: process.env.MONGODB_URI ?? "",
  allowedAdminEmails: allowedEmailsRaw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  otpTtlMinutes: parseNumber(process.env.OTP_TTL_MINUTES, 10),
  adminSessionTtlHours: parseNumber(process.env.ADMIN_SESSION_TTL_HOURS, 12),
  tokenTtlDays: parseNumber(process.env.TOKEN_TTL_DAYS, 30),
  exposeOtpInResponse: String(process.env.EXPOSE_OTP_IN_RESPONSE ?? "false").toLowerCase() === "true",
};
