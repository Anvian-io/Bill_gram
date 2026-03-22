import path from "path";
import fs from "fs";
import os from "os";
import archiver from "archiver";
import unzipper from "unzipper";
import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
} from "../../utils/index.js";
import {
  getAuthUrl,
  exchangeCodeForTokens,
  buildAuthenticatedClient,
  getGoogleUserEmail,
  uploadFileToDrive,
  cleanupOldBackupsInDrive,
  checkInternetConnectivity,
} from "../../utils/googleDriveService.js";
import { getDatabasePath, closeDatabase, initializeDatabase } from "../../db/database.js";

const IST_OFFSET_MINUTES = 330;

// ─── Helpers ────────────────────────────────────────────────────────────────

const getShopkeeperDir = () => {
  const appName = "Shopkeeper";
  const platform = os.platform();
  const homeDir = os.homedir();

  switch (platform) {
    case "win32":
      return path.join(homeDir, "AppData", "Local", appName);
    case "darwin":
      return path.join(homeDir, "Library", "Application Support", appName);
    case "linux":
      return path.join(homeDir, ".config", appName);
    default:
      return path.join(homeDir, `.${appName.toLowerCase()}`);
  }
};

/**
 * Zip the Shopkeeper folder into a temp file
 * Returns { zipPath, fileName }
 */
async function zipShopkeeperFolder() {
  const sourceDir = getShopkeeperDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `shopkeeper-backup-${timestamp}.zip`;
  const zipPath = path.join(os.tmpdir(), fileName);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve({ zipPath, fileName }));
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

/**
 * Get authenticated oauth client for a user
 */
async function getAuthClientForUser(prisma, userId) {
  const tokenRecord = await prisma.googleDriveToken.findUnique({
    where: { userId },
  });
  if (!tokenRecord) return null;

  const oAuth2Client = buildAuthenticatedClient(
    tokenRecord.accessToken,
    tokenRecord.refreshToken,
    tokenRecord.tokenExpiry
  );

  // Handle token refresh and update DB
  oAuth2Client.on("tokens", async (tokens) => {
    try {
      const updateData = { accessToken: tokens.access_token };
      if (tokens.refresh_token) updateData.refreshToken = tokens.refresh_token;
      if (tokens.expiry_date)
        updateData.tokenExpiry = new Date(tokens.expiry_date);
      await prisma.googleDriveToken.update({
        where: { userId },
        data: updateData,
      });
    } catch (e) {
      console.error("Failed to update refreshed token:", e);
    }
  });

  return oAuth2Client;
}

function getTodayBoundsInIst(date = new Date()) {
  const start = new Date(date);
  start.setUTCMinutes(start.getUTCMinutes() + IST_OFFSET_MINUTES);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCMinutes(start.getUTCMinutes() - IST_OFFSET_MINUTES);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

export async function getTodaySuccessfulBackup(prisma, userId) {
  const { start, end } = getTodayBoundsInIst();

  return prisma.backupHistory.findFirst({
    where: {
      userId,
      status: "success",
      trigger: { in: ["auto", "manual"] },
      createdAt: {
        gte: start,
        lt: end,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      trigger: true,
      fileName: true,
      driveLink: true,
      fileSizeKb: true,
      createdAt: true,
    },
  });
}

// ─── Core Backup Logic (shared by manual + scheduler) ───────────────────────

export async function performBackup(prisma, userId, trigger = "manual") {
  const online = await checkInternetConnectivity();
  if (!online) {
    await prisma.backupHistory.create({
      data: {
        userId,
        status: "skipped",
        trigger,
        errorMsg: "No internet connectivity",
      },
    });
    return { success: false, reason: "No internet connectivity" };
  }

  const oAuth2Client = await getAuthClientForUser(prisma, userId);
  if (!oAuth2Client) {
    await prisma.backupHistory.create({
      data: {
        userId,
        status: "failed",
        trigger,
        errorMsg: "Google Drive not connected",
      },
    });
    return { success: false, reason: "Google Drive not connected" };
  }

  let zipPath = null;
  try {
    const { zipPath: zp, fileName } = await zipShopkeeperFolder();
    zipPath = zp;

    const { driveFileId, driveLink, fileSizeKb } = await uploadFileToDrive(
      oAuth2Client,
      zipPath,
      fileName
    );

    // Keep Drive usage minimal by retaining only the latest uploaded backup.
    try {
      const { deletedFileIds } = await cleanupOldBackupsInDrive(
        oAuth2Client,
        driveFileId
      );
      if (deletedFileIds.length > 0) {
        await prisma.backupHistory.updateMany({
          where: {
            userId,
            driveFileId: { in: deletedFileIds },
          },
          data: {
            driveFileId: null,
            driveLink: null,
          },
        });
      }
    } catch (cleanupError) {
      console.warn("Backup succeeded, but old backup cleanup failed:", cleanupError);
    }

    await prisma.backupHistory.create({
      data: {
        userId,
        status: "success",
        trigger,
        fileName,
        driveFileId,
        driveLink,
        fileSizeKb,
      },
    });

    return { success: true, fileName, driveLink, fileSizeKb };
  } catch (error) {
    console.error("Backup error:", error);
    await prisma.backupHistory.create({
      data: {
        userId,
        status: "failed",
        trigger,
        errorMsg: error.message?.substring(0, 500),
      },
    });
    return { success: false, reason: error.message };
  } finally {
    if (zipPath && fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
  }
}

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * GET /api/backup/auth-url
 * Returns the Google OAuth consent URL
 */
export const getGoogleAuthUrl = asyncHandler(async (req, res) => {
  try {
    const url = getAuthUrl();
    return sendResponse(res, true, { url }, "Auth URL generated", statusType.OK);
  } catch (error) {
    return sendResponse(res, false, null, error.message, statusType.INTERNAL_SERVER_ERROR);
  }
});

/**
 * GET /api/backup/download
 * Creates a zip of the current Shopkeeper data and returns it as a download.
 */
export const downloadBackupZip = asyncHandler(async (req, res) => {
  let zipPath = null;
  try {
    const { zipPath: zp, fileName } = await zipShopkeeperFolder();
    zipPath = zp;

    res.download(zipPath, fileName, (err) => {
      if (zipPath && fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }

      if (err) {
        console.error("Download backup error:", err);
        if (!res.headersSent) {
          sendResponse(
            res,
            false,
            null,
            "Failed to download backup",
            statusType.INTERNAL_SERVER_ERROR
          );
        }
      }
    });
  } catch (error) {
    if (zipPath && fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
    console.error("Download backup error:", error);
    return sendResponse(
      res,
      false,
      null,
      error.message || "Failed to create backup zip",
      statusType.INTERNAL_SERVER_ERROR
    );
  }
});

/**
 * GET /api/backup/oauth/callback
 * Google redirects here after user consent
 */
export const googleOAuthCallback = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const { code, error } = req.query;

  if (error) {
    return res.redirect(
      `http://localhost:5173/backup?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return res.redirect(`http://localhost:5173/backup?error=missing_code`);
  }

  // We need the user id — passed as 'state' param or from session
  // Since this route is outside verifyUser, we use the 'state' query param
  const userId = parseInt(req.query.state);
  if (!userId || isNaN(userId)) {
    return res.redirect(`http://localhost:5173/backup?error=invalid_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const oAuth2Client = buildAuthenticatedClient(
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date ? new Date(tokens.expiry_date) : null
    );
    const email = await getGoogleUserEmail(oAuth2Client);

    await prisma.googleDriveToken.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        email,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        email,
      },
    });

    return res.redirect(`http://localhost:5173/backup?connected=true`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return res.redirect(
      `http://localhost:5173/backup?error=${encodeURIComponent(err.message)}`
    );
  }
});

/**
 * GET /api/backup/drive-status
 * Returns Google Drive connection status for the current user
 */
export const getGoogleDriveStatus = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const userId = req.user.userId;
  const tokenRecord = await prisma.googleDriveToken.findUnique({
    where: { userId },
    select: { email: true, tokenExpiry: true, createdAt: true, updatedAt: true },
  });

  if (!tokenRecord) {
    return sendResponse(
      res,
      true,
      { connected: false },
      "Not connected",
      statusType.OK
    );
  }

  return sendResponse(
    res,
    true,
    {
      connected: true,
      email: tokenRecord.email,
      tokenExpiry: tokenRecord.tokenExpiry,
      connectedAt: tokenRecord.createdAt,
      lastUpdated: tokenRecord.updatedAt,
    },
    "Drive status fetched",
    statusType.OK
  );
});

/**
 * DELETE /api/backup/disconnect
 * Revoke and delete the stored Google Drive token
 */
export const disconnectGoogleDrive = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const userId = req.user.userId;

  const existing = await prisma.googleDriveToken.findUnique({
    where: { userId },
  });

  if (!existing) {
    return sendResponse(res, false, null, "Not connected to Google Drive", statusType.NOT_FOUND);
  }

  await prisma.googleDriveToken.delete({ where: { userId } });

  return sendResponse(
    res,
    true,
    null,
    "Google Drive disconnected successfully",
    statusType.OK
  );
});

/**
 * POST /api/backup/trigger
 * Manual backup trigger
 */
export const triggerManualBackup = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const userId = req.user.userId;
  const result = await performBackup(prisma, userId, "manual");

  if (!result.success) {
    return sendResponse(
      res,
      false,
      null,
      result.reason || "Backup failed",
      result.reason === "No internet connectivity"
        ? statusType.SERVICE_UNAVAILABLE
        : statusType.INTERNAL_SERVER_ERROR
    );
  }

  return sendResponse(
    res,
    true,
    {
      fileName: result.fileName,
      driveLink: result.driveLink,
      fileSizeKb: result.fileSizeKb,
    },
    "Backup completed successfully",
    statusType.OK
  );
});

/**
 * POST /api/backup/ensure-daily
 * Ensures the logged-in user has one successful backup for the current IST day.
 */
export const ensureDailyBackup = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const userId = req.user.userId;
  const existingBackup = await getTodaySuccessfulBackup(prisma, userId);

  if (existingBackup) {
    return sendResponse(
      res,
      true,
      {
        alreadyBackedUp: true,
        backupTaken: true,
        attempted: false,
        backup: existingBackup,
        checkedAt: new Date().toISOString(),
      },
      "Today's backup already exists",
      statusType.OK
    );
  }

  const driveToken = await prisma.googleDriveToken.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!driveToken) {
    return sendResponse(
      res,
      true,
      {
        alreadyBackedUp: false,
        backupTaken: false,
        attempted: false,
        reason: "Google Drive not connected",
        checkedAt: new Date().toISOString(),
      },
      "Google Drive not connected",
      statusType.OK
    );
  }

  const result = await performBackup(prisma, userId, "auto");

  return sendResponse(
    res,
    true,
    {
      alreadyBackedUp: false,
      backupTaken: result.success,
      attempted: true,
      fileName: result.fileName || null,
      driveLink: result.driveLink || null,
      fileSizeKb: result.fileSizeKb || null,
      reason: result.success ? null : result.reason || "Backup failed",
      checkedAt: new Date().toISOString(),
    },
    result.success ? "Daily backup completed" : result.reason || "Backup failed",
    statusType.OK
  );
});

/**
 * GET /api/backup/history
 * Returns paginated backup history for the logged-in user
 */
export const getBackupHistory = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const userId = req.user.userId;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const [history, total] = await Promise.all([
    prisma.backupHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        status: true,
        trigger: true,
        fileName: true,
        driveFileId: true,
        driveLink: true,
        fileSizeKb: true,
        errorMsg: true,
        createdAt: true,
      },
    }),
    prisma.backupHistory.count({ where: { userId } }),
  ]);

  return sendResponse(
    res,
    true,
    {
      history,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
    "Backup history fetched",
    statusType.OK
  );
});

/**
 * GET /api/backup/connectivity
 * Quick internet connectivity check from the server
 */
export const checkConnectivity = asyncHandler(async (req, res) => {
  const online = await checkInternetConnectivity();
  return sendResponse(
    res,
    true,
    { online, checkedAt: new Date().toISOString() },
    online ? "Internet available" : "No internet connection",
    statusType.OK
  );
});

/**
 * Shared restore logic for authenticated and pre-login restore flows.
 */
async function restoreBackupFromUpload(prisma, file, userId = null) {
  const targetDir = getShopkeeperDir();
  const tmpZipPath = path.join(os.tmpdir(), `restore-${Date.now()}.zip`);

  try {
    fs.writeFileSync(tmpZipPath, file.buffer);

    const fileSizeKb = parseFloat((file.size / 1024).toFixed(2));

    await closeDatabase();

    await new Promise((resolve, reject) => {
      fs.createReadStream(tmpZipPath)
        .pipe(
          unzipper.Extract({
            path: targetDir,
            forceStream: true,
          })
        )
        .on("close", resolve)
        .on("error", reject);
    });

    await initializeDatabase();

    if (userId) {
      await prisma.backupHistory.create({
        data: {
          userId,
          status: "success",
          trigger: "restore",
          fileName: file.originalname,
          fileSizeKb,
        },
      });
    }

    return { success: true, fileName: file.originalname, fileSizeKb };
  } catch (error) {
    console.error("Restore error:", error);

    try {
      await initializeDatabase();
    } catch {}

    if (userId) {
      await prisma.backupHistory.create({
        data: {
          userId,
          status: "failed",
          trigger: "restore",
          errorMsg: error.message?.substring(0, 500),
        },
      });
    }

    throw error;
  } finally {
    if (fs.existsSync(tmpZipPath)) {
      fs.unlinkSync(tmpZipPath);
    }
  }
}

/**
 * POST /api/backup/restore
 * Accepts a zip file upload, extracts it to the Shopkeeper data folder
 */
export const restoreFromUpload = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const userId = req.user.userId;

  if (!req.file) {
    return sendResponse(
      res,
      false,
      null,
      "No zip file provided",
      statusType.BAD_REQUEST
    );
  }

  try {
    const result = await restoreBackupFromUpload(prisma, req.file, userId);

    return sendResponse(
      res,
      true,
      result,
      "Database restored successfully",
      statusType.OK
    );
  } catch (error) {
    return sendResponse(
      res,
      false,
      null,
      `Restore failed: ${error.message}`,
      statusType.INTERNAL_SERVER_ERROR
    );
  }
});

/**
 * POST /api/backup/restore-public
 * Allows restore from the login page before authentication.
 */
export const restoreFromUploadPublic = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  if (!req.file) {
    return sendResponse(
      res,
      false,
      null,
      "No zip file provided",
      statusType.BAD_REQUEST
    );
  }

  try {
    const result = await restoreBackupFromUpload(prisma, req.file);

    return sendResponse(
      res,
      true,
      result,
      "Database restored successfully",
      statusType.OK
    );
  } catch (error) {
    return sendResponse(
      res,
      false,
      null,
      `Restore failed: ${error.message}`,
      statusType.INTERNAL_SERVER_ERROR
    );
  }
});
