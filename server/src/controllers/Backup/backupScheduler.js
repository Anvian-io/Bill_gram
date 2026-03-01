import cron from "node-cron";
import { getDb } from "../../db/database.js";
import { performBackup } from "./backupController.js";

/**
 * Initialize the daily auto-backup scheduler.
 * Runs at 00:00 (midnight) every day.
 * Fetches all users with a connected Google Drive and backs up for each.
 */
export function initBackupScheduler() {
  // Run at midnight every day: "0 0 * * *"
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("⏰ [Backup Scheduler] Running daily backup...");
      const prisma = getDb();

      try {
        // Get all users who have a Google Drive token
        const tokens = await prisma.googleDriveToken.findMany({
          select: { userId: true },
        });

        if (tokens.length === 0) {
          console.log("📦 [Backup Scheduler] No users with Drive connected. Skipping.");
          return;
        }

        console.log(`📦 [Backup Scheduler] Backing up for ${tokens.length} user(s)...`);

        for (const { userId } of tokens) {
          try {
            const result = await performBackup(prisma, userId, "auto");
            if (result.success) {
              console.log(
                `✅ [Backup Scheduler] User ${userId} — backup succeeded: ${result.fileName}`
              );
            } else {
              console.warn(
                `⚠️ [Backup Scheduler] User ${userId} — backup skipped/failed: ${result.reason}`
              );
            }
          } catch (err) {
            console.error(`❌ [Backup Scheduler] User ${userId} — error:`, err.message);
          }
        }

        console.log("✅ [Backup Scheduler] Daily backup complete.");
      } catch (err) {
        console.error("❌ [Backup Scheduler] Fatal error:", err);
      }
    },
    {
      timezone: "Asia/Kolkata", // IST timezone
    }
  );

  console.log("⏰ Backup scheduler initialized — runs daily at 12:00 AM IST");
}
