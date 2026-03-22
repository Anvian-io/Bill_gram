import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { backupService } from "@/services/backupService";

const getSessionKey = (userId: number) => `daily-backup-check:${userId}`;

export default function BackupSessionGuard() {
  const { user, loading } = useAuth();
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (loading || !user?.id || inFlightRef.current) {
      return;
    }

    const sessionKey = getSessionKey(user.id);
    if (window.sessionStorage.getItem(sessionKey) === "done") {
      return;
    }

    let cancelled = false;
    inFlightRef.current = true;

    const ensureBackup = async () => {
      try {
        const result = await backupService.ensureDailyBackup();

        if (cancelled) {
          return;
        }

        window.sessionStorage.setItem(sessionKey, "done");

        if (!result.attempted || !result.backupTaken || result.alreadyBackedUp) {
          return;
        }

        toast.success(
          result.fileName
            ? `Daily backup completed: ${result.fileName}`
            : "Daily backup completed successfully"
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to ensure today's backup:", error);
        }
      } finally {
        inFlightRef.current = false;
      }
    };

    ensureBackup();

    return () => {
      cancelled = true;
      inFlightRef.current = false;
    };
  }, [loading, user?.id]);

  return null;
}
