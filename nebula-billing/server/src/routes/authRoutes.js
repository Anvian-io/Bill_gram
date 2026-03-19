import { Router } from "express";
import { env } from "../config/env.js";
import { AdminSession } from "../models/AdminSession.js";
import { OtpChallenge } from "../models/OtpChallenge.js";
import { sendOtpEmail } from "../services/mailService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateOtp, generateRandomToken, hashValue } from "../utils/crypto.js";
import { normalizeEmail } from "../utils/normalize.js";

const router = Router();

router.post(
  "/request-otp",
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!env.allowedAdminEmails.includes(email)) {
      return res.status(403).json({ message: "This email is not allowed to enter the OTP flow" });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + env.otpTtlMinutes * 60 * 1000);

    await OtpChallenge.findOneAndUpdate(
      { email },
      {
        email,
        otpHash: hashValue(otp),
        expiresAt,
        attempts: 0,
        verifiedAt: null,
        lastRequestedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    let deliveryWarning = null;

    try {
      await sendOtpEmail({
        email,
        otp,
        expiresInMinutes: env.otpTtlMinutes,
      });
    } catch (error) {
      deliveryWarning = error instanceof Error ? error.message : "Failed to send OTP email";
      console.error(`Failed to send OTP email to ${email}`, error);

      if (!env.exposeOtpInResponse) {
        return res.status(500).json({
          message: "OTP was generated but email delivery failed",
          deliveryWarning,
        });
      }
    }

    return res.status(200).json({
      message: deliveryWarning ? "OTP generated with delivery fallback" : "OTP generated and sent successfully",
      ...(deliveryWarning ? { deliveryWarning } : {}),
      ...(env.exposeOtpInResponse ? { otp } : {}),
    });
  }),
);

router.post(
  "/verify-otp",
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp ?? "").trim();

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const challenge = await OtpChallenge.findOne({ email });

    if (!challenge) {
      return res.status(400).json({ message: "OTP request not found for this email" });
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      return res.status(400).json({ message: "OTP has expired. Request a new one." });
    }

    if (challenge.otpHash !== hashValue(otp)) {
      challenge.attempts += 1;
      await challenge.save();
      return res.status(400).json({ message: "OTP is incorrect" });
    }

    challenge.verifiedAt = new Date();
    challenge.attempts = 0;
    await challenge.save();

    await AdminSession.deleteMany({ email });

    const sessionToken = generateRandomToken("ADM", 24);
    const expiresAt = new Date(Date.now() + env.adminSessionTtlHours * 60 * 60 * 1000);

    await AdminSession.create({
      email,
      sessionToken,
      expiresAt,
    });

    return res.status(200).json({
      message: "OTP verified successfully",
      email,
      sessionToken,
      expiresAt,
      redirectUrl: `${env.clientOrigin}/AdminPage`,
    });
  }),
);

export default router;
