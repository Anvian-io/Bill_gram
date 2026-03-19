import { Router } from "express";
import { env } from "../config/env.js";
import { requireAdminSession } from "../middleware/requireAdminSession.js";
import { InviteToken } from "../models/InviteToken.js";
import { ManagedUser } from "../models/ManagedUser.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateRandomToken } from "../utils/crypto.js";
import { normalizeEmail } from "../utils/normalize.js";

const router = Router();

router.use(requireAdminSession);

router.post(
  "/tokens",
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
    const token = String(req.body?.token ?? "").trim();

    if (!email || !name || !phoneNumber || !token) {
      return res.status(400).json({ message: "Email, name, phone number, and token are required" });
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

    const user = await ManagedUser.create({
      email,
      name,
      phoneNumber,
      registeredBy: req.admin.email,
      inviteToken: inviteToken.token,
    });

    inviteToken.used = true;
    inviteToken.usedAt = new Date();
    inviteToken.usedByEmail = email;
    await inviteToken.save();

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
        registeredBy: user.registeredBy,
        inviteToken: user.inviteToken,
      },
    });
  }),
);

router.get(
  "/users",
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
