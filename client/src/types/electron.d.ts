export interface UpdateStatusPayload {
  status:
    | "checking"
    | "available"
    | "not-available"
    | "downloading"
    | "downloaded"
    | "error";
  version?: string;
  releaseNotes?: string;
  message?: string;
  percent?: number;
  transferred?: number;
  total?: number;
}

export interface ElectronAPI {
  backupDatabase: () => Promise<{ success: boolean; path?: string; error?: string }>;
  restoreDatabase: (
    path: string,
  ) => Promise<{ success: boolean; error?: string }>;
  saveUserCredential: (
    credential: Record<string, unknown>,
  ) => Promise<{ success: boolean; error?: string }>;
  getUserCredential: (
    email: string,
  ) => Promise<{ success: boolean; record?: Record<string, unknown> | null; error?: string }>;
  platform: string;
  isElectron: boolean;
  getAppVersion: () => Promise<string>;
  getUpdateStatus: () => Promise<UpdateStatusPayload | null>;
  checkForUpdates: () => Promise<{
    success: boolean;
    updateInfo?: { version?: string } | null;
    error?: string;
  }>;
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
  installUpdate: () => Promise<{ success: boolean; error?: string }>;
  onUpdateStatus: (callback: (payload: UpdateStatusPayload) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
