import { Router } from "express";
import { env } from "../config/env.js";
import { requireAdminSession } from "../middleware/requireAdminSession.js";
import { InviteToken } from "../models/InviteToken.js";
import { ManagedUser } from "../models/ManagedUser.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateRandomToken } from "../utils/crypto.js";
import { normalizeEmail } from "../utils/normalize.js";

const router = Router();

const loadNodemailer = async () => {
  try {
    const nodemailerModule = await import("nodemailer");
    return nodemailerModule.default;
  } catch {
    throw new Error(
      "nodemailer is not installed yet. Run `npm install` inside the nebula-billing/server folder to enable SMTP delivery.",
    );
  }
};

const assertMailConfig = () => {
  if (
    !env.sendinblueHost ||
    !env.sendinblueUser ||
    !env.sendinbluePassword ||
    !env.senderEmail
  ) {
    throw new Error("Brevo SMTP configuration is incomplete in nebula-billing/server/.env");
  }
};

const buildCredentialExpiryDate = (registeredAt = new Date()) =>
  new Date(
    Date.UTC(registeredAt.getUTCFullYear() + 1, 2, 31, 23, 59, 59, 999),
  );

const sendRegistrationEmail = async ({ email, name, password, expiresAt }) => {
  assertMailConfig();
  const nodemailer = await loadNodemailer();

  const transporter = nodemailer.createTransport({
    host: env.sendinblueHost,
    port: env.sendinbluePort,
    secure: false,
    auth: {
      user: env.sendinblueUser,
      pass: env.sendinbluePassword,
    },
  });

  const expiryLabel = new Date(expiresAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  await transporter.sendMail({
    from: `"${env.senderName}" <${env.senderEmail}>`,
    to: email,
    subject: "Bill Gram account credentials",
    text: `Hello ${name}, your Bill Gram account is ready. Email: ${email}. Password: ${password}. Access valid until ${expiryLabel}.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 8px;">Bill Gram Account Details</h2>
        <p>Hello ${name},</p>
        <p>Your Bill Gram account has been created successfully.</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p><strong>Access valid until:</strong> ${expiryLabel}</p>
        <p>Please keep these credentials safe.</p>
      </div>
    `,
  });
};

router.post(
  "/tokens",
  requireAdminSession,
  asyncHandler(async (req, res) => {
    const requestedDays = Number(req.body?.expiresInDays);
    const expiresInDays =
      Number.isFinite(requestedDays) && requestedDays > 0 ? requestedDays : env.tokenTtlDays;

    const token = generateRandomToken("USR", 20);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const createdToken = await InviteToken.create({
      token,
      expiresAt,
      createdByEmail: req.admin.email,
    });

    return res.status(201).json({
      message: "Token generated successfully",
      token: {
        token: createdToken.token,
        expiresAt: createdToken.expiresAt,
        used: createdToken.used,
        createdAt: createdToken.createdAt,
      },
    });
  }),
);

router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const name = String(req.body?.name ?? "").trim();
    const phoneNumber = String(req.body?.phoneNumber ?? "").trim();
    const providedPassword = String(req.body?.password ?? "").trim();
    const token = String(req.body?.token ?? "").trim();

    if (!email || !name || !phoneNumber || !token) {
      return res.status(400).json({
        message: "Email, name, phone number, and token are required",
      });
    }

    const inviteToken = await InviteToken.findOne({ token });

    if (!inviteToken) {
      return res.status(404).json({ message: "Token does not exist" });
    }

    if (inviteToken.used) {
      return res.status(409).json({ message: "Token has already been used" });
    }

    if (inviteToken.expiresAt.getTime() <= Date.now()) {
      return res.status(400).json({ message: "Token has expired" });
    }

    const existingUser = await ManagedUser.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }

    const registeredAt = new Date();
    const expiresAt = buildCredentialExpiryDate(registeredAt);
    const password =
      providedPassword || generateRandomToken("PWD", 12).replace("PWD-", "");

    const user = await ManagedUser.create({
      email,
      name,
      phoneNumber,
      registeredBy: inviteToken.createdByEmail,
      inviteToken: inviteToken.token,
    });

    inviteToken.used = true;
    inviteToken.usedAt = registeredAt;
    inviteToken.usedByEmail = email;
    await inviteToken.save();

    let deliveryWarning = null;

    try {
      await sendRegistrationEmail({
        email,
        name,
        password,
        expiresAt,
      });
    } catch (error) {
      deliveryWarning =
        error instanceof Error ? error.message : "Failed to send registration email";
      console.error(`Failed to send registration email to ${email}`, error);
    }

    return res.status(201).json({
      message: deliveryWarning
        ? "User registered successfully, but credential email could not be sent"
        : "User registered successfully",
      ...(deliveryWarning ? { deliveryWarning } : {}),
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
        registeredBy: user.registeredBy,
        inviteToken: user.inviteToken,
      },
      credentials: {
        email,
        password,
        expiresAt,
      },
    });
  }),
);

router.get(
  "/users",
  requireAdminSession,
  asyncHandler(async (_req, res) => {
    const users = await ManagedUser.find().sort({ createdAt: -1 });

    return res.status(200).json({
      users: users.map((user) => ({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
        registeredBy: user.registeredBy,
        inviteToken: user.inviteToken,
      })),
    });
  }),
);

export default router;
