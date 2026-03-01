import express from "express";
import multer from "multer";
import {
  getGoogleAuthUrl,
  googleOAuthCallback,
  getGoogleDriveStatus,
  disconnectGoogleDrive,
  triggerManualBackup,
  getBackupHistory,
  checkConnectivity,
  restoreFromUpload,
} from "./backupController.js";

const router = express.Router();

// Multer: store file in memory (for restore upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/zip" ||
      file.mimetype === "application/x-zip-compressed" ||
      file.originalname.endsWith(".zip")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .zip files are allowed"), false);
    }
  },
});

// ── Public route (no verifyUser — Google redirects here without app token) ──
router.get("/oauth/callback", googleOAuthCallback);

// ── Protected routes (all others require verifyUser via server.js middleware) ──
router.get("/auth-url", getGoogleAuthUrl);
router.get("/drive-status", getGoogleDriveStatus);
router.delete("/disconnect", disconnectGoogleDrive);
router.post("/trigger", triggerManualBackup);
router.get("/history", getBackupHistory);
router.get("/connectivity", checkConnectivity);
router.post("/restore", upload.single("file"), restoreFromUpload);

export default router;
