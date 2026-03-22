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

    // TEMPORARILY enable dev tools to see errors
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Log any load failures
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("Failed to load:", errorCode, errorDescription);
    },
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

function getCredentialDirectory() {
  if (process.env.NODE_ENV === "development") {
    return path.join(__dirname, "../client");
  }

  return path.join(app.getPath("userData"), "client");
}

function getCredentialStorePath() {
  return path.join(getCredentialDirectory(), "registered-credentials.json");
}

function ensureCredentialDirectory() {
  const credentialDir = getCredentialDirectory();
  if (!fs.existsSync(credentialDir)) {
    fs.mkdirSync(credentialDir, { recursive: true });
  }
  return credentialDir;
}

function readCredentialStore() {
  const storePath = getCredentialStorePath();

  if (!fs.existsSync(storePath)) {
    return { users: [] };
  }

  try {
    const raw = fs.readFileSync(storePath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.users) ? parsed : { users: [] };
  } catch (error) {
    console.error("Failed to read credential store:", error);
    return { users: [] };
  }
}

function writeCredentialStore(store) {
  ensureCredentialDirectory();
  const storePath = getCredentialStorePath();
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
  return storePath;
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
      `Backend server file not found at: ${backendPath}`,
    );
    return;
  }

  const dbDir = getDatabaseDirectory();
  console.log("Database directory:", dbDir);

  backendProcess = spawn("node", [backendPath], {
    stdio: "ignore", // 👈 important
    windowsHide: true, // 👈 VERY important (removes black window)
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || "production",
    },
  });

  backendProcess.unref();

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

ipcMain.handle("save-user-credential", async (_event, credential) => {
  try {
    const email = String(credential?.email ?? "").trim().toLowerCase();
    const password = String(credential?.password ?? "").trim();
    const expiresAt = String(credential?.expiresAt ?? "").trim();

    if (!email || !password || !expiresAt) {
      return {
        success: false,
        error: "Email, password, and expiry are required to save credentials",
      };
    }

    const store = readCredentialStore();
    const nextRecord = {
      ...credential,
      email,
      password,
      expiresAt,
      savedAt: new Date().toISOString(),
    };
    const existingIndex = store.users.findIndex((user) => user.email === email);

    if (existingIndex >= 0) {
      store.users[existingIndex] = nextRecord;
    } else {
      store.users.push(nextRecord);
    }

    const pathToStore = writeCredentialStore(store);
    return {
      success: true,
      path: pathToStore,
      record: nextRecord,
    };
  } catch (error) {
    console.error("Failed to save credentials:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-user-credential", async (_event, emailInput) => {
  try {
    const email = String(emailInput ?? "").trim().toLowerCase();

    if (!email) {
      return { success: false, error: "Email is required" };
    }

    const store = readCredentialStore();
    const record = store.users.find((user) => user.email === email) ?? null;

    return {
      success: true,
      path: getCredentialStorePath(),
      record,
    };
  } catch (error) {
    console.error("Failed to read credentials:", error);
    return { success: false, error: error.message };
  }
});
