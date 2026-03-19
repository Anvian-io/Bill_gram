import cron from "node-cron";
import { getDb } from "../../db/database.js";
import { getTodaySuccessfulBackup, performBackup } from "./backupController.js";

/**
 * Initialize the daily auto-backup scheduler.
 * Runs at 00:00 (midnight) every day.
 * Fetches all users with a connected Google Drive and backs up for each.
 */
export function initBackupScheduler() {
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("[Backup Scheduler] Running daily backup...");
      const prisma = getDb();

      try {
        const tokens = await prisma.googleDriveToken.findMany({
          select: { userId: true },
        });

        if (tokens.length === 0) {
          console.log("[Backup Scheduler] No users with Drive connected. Skipping.");
          return;
        }

        console.log(
          `[Backup Scheduler] Backing up for ${tokens.length} user(s)...`
        );

        for (const { userId } of tokens) {
          try {
            const existingBackup = await getTodaySuccessfulBackup(prisma, userId);

            if (existingBackup) {
              console.log(
                `[Backup Scheduler] User ${userId} already has today's backup. Skipping.`
              );
              continue;
            }

            const result = await performBackup(prisma, userId, "auto");

            if (result.success) {
              console.log(
                `[Backup Scheduler] User ${userId} backup succeeded: ${result.fileName}`
              );
            } else {
              console.warn(
                `[Backup Scheduler] User ${userId} backup skipped/failed: ${result.reason}`
              );
            }
          } catch (err) {
            console.error(
              `[Backup Scheduler] User ${userId} error:`,
              err.message
            );
          }
        }

        console.log("[Backup Scheduler] Daily backup complete.");
      } catch (err) {
        console.error("[Backup Scheduler] Fatal error:", err);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log("[Backup Scheduler] Initialized for 12:00 AM IST.");
}
