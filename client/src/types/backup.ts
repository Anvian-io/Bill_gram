// Types for Google Drive Backup & Restore feature

export interface GoogleDriveStatus {
  connected: boolean;
  email?: string;
  tokenExpiry?: string;
  connectedAt?: string;
  lastUpdated?: string;
}

export interface BackupHistoryItem {
  id: number;
  status: "success" | "failed" | "skipped";
  trigger: "auto" | "manual" | "restore";
  fileName?: string;
  driveFileId?: string;
  driveLink?: string;
  fileSizeKb?: number;
  errorMsg?: string;
  createdAt: string;
}

export interface BackupHistoryResponse {
  history: BackupHistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ConnectivityStatus {
  online: boolean;
  checkedAt: string;
}

export interface TriggerBackupResult {
  fileName: string;
  driveLink: string;
  fileSizeKb: number;
}

export interface RestoreResult {
  fileName: string;
  fileSizeKb: number;
}
