const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");

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

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // Production build
    const indexPath = path.join(__dirname, "../client/dist/index.html");
    console.log("Loading frontend from:", indexPath);
    console.log("File exists:", fs.existsSync(indexPath));

    mainWindow.loadFile(indexPath);

    // ✅ REMOVE THIS LINE WHEN DONE DEBUGGING
    // mainWindow.webContents.openDevTools();

    // 🚀 ADD THESE LINES TO HIDE MENU
    mainWindow.setMenu(null); // Completely removes the menu
    mainWindow.setMenuBarVisibility(false); // Hides menu bar
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Log any load failures
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("Failed to load:", errorCode, errorDescription);
    }
  );

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

/**
 * Get the database directory path based on platform
 * This matches the logic in database.js
 */
function getDatabaseDirectory() {
  const appName = "Shopkeeper";

  if (process.env.NODE_ENV === "development") {
    return path.join(__dirname, "../server/data");
  }

  const platform = os.platform();
  const homeDir = os.homedir();

  switch (platform) {
    case "win32": // Windows
      return path.join(homeDir, "AppData", "Local", appName);
    case "darwin": // macOS
      return path.join(homeDir, "Library", "Application Support", appName);
    case "linux": // Linux
      return path.join(homeDir, ".config", appName);
    default:
      return path.join(homeDir, `.${appName.toLowerCase()}`);
  }
}

function startBackend() {
  let backendPath;

  if (process.env.NODE_ENV === "development") {
    backendPath = path.join(__dirname, "../server/src/server.js");
  } else {
    backendPath = path.join(process.resourcesPath, "server/src/server.js");
  }

  console.log("Starting backend from:", backendPath);

  if (!fs.existsSync(backendPath)) {
    console.error("Backend file not found at:", backendPath);
    dialog.showErrorBox(
      "Backend Error",
      `Backend server file not found at: ${backendPath}`
    );
    return;
  }

  const dbDir = getDatabaseDirectory();
  console.log("Database directory:", dbDir);

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

// IPC Handlers

ipcMain.handle("get-database-location", async () => {
  const dbDir = getDatabaseDirectory();
  return path.join(dbDir, "shopkeeper.db");
});

ipcMain.handle("backup-database", async () => {
  try {
    const dbDir = getDatabaseDirectory();
    const dbPath = path.join(dbDir, "shopkeeper.db");
    const backupDir = path.join(app.getPath("documents"), "ShopkeeperBackups");

    // Check if database exists
    if (!fs.existsSync(dbPath)) {
      return { success: false, error: "Database file not found" };
    }

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
    const dbDir = getDatabaseDirectory();
    const dbPath = path.join(dbDir, "shopkeeper.db");

    if (!fs.existsSync(backupPath)) {
      return { success: false, error: "Backup file not found" };
    }

    // Create a backup of current database before restoring
    const tempBackup = path.join(dbDir, `temp-backup-${Date.now()}.db`);
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, tempBackup);
    }

    try {
      fs.copyFileSync(backupPath, dbPath);

      // Delete temp backup if restore successful
      if (fs.existsSync(tempBackup)) {
        fs.unlinkSync(tempBackup);
      }

      return { success: true };
    } catch (restoreError) {
      // Restore from temp backup if restore failed
      if (fs.existsSync(tempBackup)) {
        fs.copyFileSync(tempBackup, dbPath);
        fs.unlinkSync(tempBackup);
      }
      throw restoreError;
    }
  } catch (error) {
    console.error("Restore failed:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("open-database-folder", async () => {
  try {
    const dbDir = getDatabaseDirectory();
    shell.openPath(dbDir);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
