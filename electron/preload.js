// electron/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  backupDatabase: () => ipcRenderer.invoke("backup-database"),
  restoreDatabase: (path) => ipcRenderer.invoke("restore-database", path),
  saveUserCredential: (credential) =>
    ipcRenderer.invoke("save-user-credential", credential),
  getUserCredential: (email) => ipcRenderer.invoke("get-user-credential", email),
  platform: process.platform,
  isElectron: true,
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getUpdateStatus: () => ipcRenderer.invoke("get-update-status"),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
  onUpdateStatus: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("update-status", listener);
    return () => ipcRenderer.removeListener("update-status", listener);
  },
  moveCursorTo: (clientX, clientY) =>
    ipcRenderer.invoke("move-cursor-to", { clientX, clientY }),
  printPdf: (pdfArrayBuffer, options) =>
    ipcRenderer.invoke("print-pdf", pdfArrayBuffer, options),
});
