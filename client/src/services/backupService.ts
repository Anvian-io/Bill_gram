import { apiClient } from "../api/api-client";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";
import type {
  GoogleDriveStatus,
  BackupHistoryResponse,
  ConnectivityStatus,
  TriggerBackupResult,
  EnsureDailyBackupResult,
  RestoreResult,
} from "@/types/backup";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const backupService = {
  /**
   * Check internet connectivity (polled from backend)
   */
  async getConnectivityStatus(): Promise<ConnectivityStatus> {
    try {
      const response = await apiClient.get<ApiResponse<ConnectivityStatus>>(
        "/backup/connectivity",
      );
      return response.data.data;
    } catch {
      // If the request itself fails, we're definitely offline
      return { online: false, checkedAt: new Date().toISOString() };
    }
  },

  /**
   * Get Google Drive connection status
   */
  async getDriveStatus(): Promise<GoogleDriveStatus> {
    try {
      const response = await apiClient.get<ApiResponse<GoogleDriveStatus>>(
        "/backup/drive-status",
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get Google OAuth consent URL (includes userId as state param)
   */
  async getAuthUrl(): Promise<string> {
    try {
      const response =
        await apiClient.get<ApiResponse<{ url: string }>>("/backup/auth-url");
      return response.data.data.url;
    } catch (error) {
      const message = getApiErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Disconnect Google Drive
   */
  async disconnectDrive(): Promise<void> {
    try {
      await apiClient.delete("/backup/disconnect");
    } catch (error) {
      const message = getApiErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Trigger a manual backup
   */
  async triggerBackup(): Promise<TriggerBackupResult> {
    try {
      const response =
        await apiClient.post<ApiResponse<TriggerBackupResult>>(
          "/backup/trigger",
        );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Ensure today's backup exists for the logged-in user.
   */
  async ensureDailyBackup(): Promise<EnsureDailyBackupResult> {
    try {
      const response = await apiClient.post<
        ApiResponse<EnsureDailyBackupResult>
      >("/backup/ensure-daily");
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Download a local zip backup from backend and trigger browser download.
   */
  async downloadBackupZip(): Promise<string> {
    try {
      const response = await apiClient.get<Blob>("/backup/download", {
        responseType: "blob",
      });

      const disposition = response.headers["content-disposition"];
      const fileNameMatch = disposition?.match(/filename="?([^"]+)"?/i);
      const fileName =
        fileNameMatch?.[1] ||
        `billgram-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;

      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      return fileName;
    } catch (error) {
      const message = getApiErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get paginated backup history
   */
  async getHistory(page = 1, limit = 10): Promise<BackupHistoryResponse> {
    try {
      const response = await apiClient.get<ApiResponse<BackupHistoryResponse>>(
        `/backup/history?page=${page}&limit=${limit}`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Restore database from a uploaded zip file
   */
  async restoreFromUpload(
    file: File,
    options?: { publicRoute?: boolean },
  ): Promise<RestoreResult> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const route = options?.publicRoute
        ? "http://localhost:3001/api/backup/restore-public"
        : "http://localhost:3001/api/backup/restore";

      // Use Headers object to avoid TypeScript union issues
      const headers = new Headers();
      if (token && !options?.publicRoute) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(route, {
        method: "POST",
        headers,
        body: formData,
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Restore failed");
      }

      return json.data as RestoreResult;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error("Restore failed");
    }
  },
};
