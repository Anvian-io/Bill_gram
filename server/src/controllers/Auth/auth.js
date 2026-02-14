//server/src/route/auth.js

import express from "express";
import { authController } from "./authController.js";

const router = express.Router();

// Register route
router.post("/register", authController.register);

// Login route
router.post("/login", authController.login);

// Check authentication route
router.get("/check", authController.check);

export default router;
