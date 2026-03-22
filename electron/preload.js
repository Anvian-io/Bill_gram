// electron/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  backupDatabase: () => ipcRenderer.invoke("backup-database"),
  restoreDatabase: (path) => ipcRenderer.invoke("restore-database", path),
  saveUserCredential: (credential) =>
    ipcRenderer.invoke("save-user-credential", credential),
  getUserCredential: (email) => ipcRenderer.invoke("get-user-credential", email),
  platform: process.platform,
});
