const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  backupDatabase: () => ipcRenderer.invoke("backup-database"),
  restoreDatabase: (path) => ipcRenderer.invoke("restore-database", path),
  platform: process.platform,
});
