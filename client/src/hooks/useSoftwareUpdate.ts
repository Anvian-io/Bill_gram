import { useCallback, useEffect, useState } from "react";
import type { UpdateStatusPayload } from "@/types/electron";

type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "error";

function isElectronApp() {
  return typeof window !== "undefined" && Boolean(window.electronAPI?.isElectron);
}

export function useSoftwareUpdate() {
  const [state, setState] = useState<UpdateState>("idle");
  const [currentVersion, setCurrentVersion] = useState<string>("");
  const [availableVersion, setAvailableVersion] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isElectron] = useState(isElectronApp);

  useEffect(() => {
    if (!isElectron || !window.electronAPI) {
      return;
    }

    window.electronAPI.getAppVersion().then(setCurrentVersion).catch(() => {
      setCurrentVersion("");
    });

    const unsubscribe = window.electronAPI.onUpdateStatus(
      (payload: UpdateStatusPayload) => {
        switch (payload.status) {
          case "checking":
            setState("checking");
            setErrorMessage("");
            break;
          case "available":
            setState("available");
            setAvailableVersion(payload.version ?? "");
            setErrorMessage("");
            break;
          case "not-available":
            setState("idle");
            setAvailableVersion("");
            break;
          case "downloading":
            setState("downloading");
            setProgress(Math.round(payload.percent ?? 0));
            break;
          case "downloaded":
            setState("downloaded");
            setProgress(100);
            if (payload.version) {
              setAvailableVersion(payload.version);
            }
            break;
          case "error":
            setState("error");
            setErrorMessage(payload.message ?? "Update check failed");
            break;
          default:
            break;
        }
      },
    );

    return unsubscribe;
  }, [isElectron]);

  const checkForUpdates = useCallback(async () => {
    if (!window.electronAPI) {
      return;
    }

    setState("checking");
    setErrorMessage("");

    const result = await window.electronAPI.checkForUpdates();
    if (!result.success) {
      setState("error");
      setErrorMessage(result.error ?? "Unable to check for updates");
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    if (!window.electronAPI) {
      return;
    }

    setState("downloading");
    setProgress(0);

    const result = await window.electronAPI.downloadUpdate();
    if (!result.success) {
      setState("error");
      setErrorMessage(result.error ?? "Unable to download update");
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (!window.electronAPI) {
      return;
    }

    await window.electronAPI.installUpdate();
  }, []);

  const dismissError = useCallback(() => {
    setState("idle");
    setErrorMessage("");
  }, []);

  return {
    isElectron,
    state,
    currentVersion,
    availableVersion,
    progress,
    errorMessage,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    dismissError,
  };
}
