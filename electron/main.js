// electron/main.js
const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../assets/icon.ico"),
    show: false,
  });

  // In development, load from Vite dev server
  // In production, load from built files
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../client/dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function startBackend() {
  const backendPath = path.join(__dirname, "../server/src/server.js");

  backendProcess = spawn("node", [backendPath], {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || "production",
    },
  });

  backendProcess.on("error", (err) => {
    console.error("Failed to start backend:", err);
    dialog.showErrorBox("Backend Error", "Failed to start backend server");
  });

  backendProcess.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Backend exited with code ${code}`);
    }
  });
}

app.whenReady().then(() => {
  // Only start backend in production mode
  // In development, backend is started separately by npm run dev:server
  if (process.env.NODE_ENV !== "development") {
    startBackend();
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (backendProcess) {
      backendProcess.kill();
    }
    app.quit();
  }
});

// IPC Handlers for backup/restore
ipcMain.handle("backup-database", async () => {
  try {
    const appDataPath = app.getPath("userData");
    const dbPath = path.join(appDataPath, "shopkeeper.db");
    const backupDir = path.join(app.getPath("documents"), "ShopkeeperBackups");

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(backupDir, `backup-${timestamp}.db`);

    fs.copyFileSync(dbPath, backupPath);
    return { success: true, path: backupPath };
  } catch (error) {
    console.error("Backup failed:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("restore-database", async (event, backupPath) => {
  try {
    const appDataPath = app.getPath("userData");
    const dbPath = path.join(appDataPath, "shopkeeper.db");

    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, dbPath);
      return { success: true };
    } else {
      return { success: false, error: "Backup file not found" };
    }
  } catch (error) {
    console.error("Restore failed:", error);
    return { success: false, error: error.message };
  }
});
