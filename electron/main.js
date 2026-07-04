const { app, BrowserWindow, ipcMain, shell, dialog, screen } = require("electron");
const path = require("path");
const { spawn, execFileSync } = require("child_process");
const { moveSystemCursor, resolveScreenPoint } = require("./moveCursor");
const fs = require("fs");
const os = require("os");
const http = require("http");
const { autoUpdater } = require("electron-updater");

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu");

let mainWindow;
let backendProcess;
let updatesEnabled = false;
let lastUpdateStatus = null;
let frontendUpdateCheckScheduled = false;

const BACKEND_HEALTH_URL = "http://127.0.0.1:3001/api/health";
const BACKEND_START_TIMEOUT_MS = 180000;
const BACKEND_POLL_INTERVAL_MS = 1000;
const BACKEND_LOG_FILE = "backend-startup.log";

function getLoadingHtml(message = "Starting your workspace...") {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta
          http-equiv="Content-Security-Policy"
          content="default-src 'none'; style-src 'unsafe-inline';"
        />
        <title>Bill Gram</title>
        <style>
          :root {
            color-scheme: light;
            font-family: Inter, "Segoe UI", Arial, sans-serif;
            background: #f5f7fb;
            color: #172033;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background:
              radial-gradient(circle at 20% 10%, rgba(22, 163, 74, 0.12), transparent 28%),
              linear-gradient(135deg, #f8fbff 0%, #eef3f8 100%);
          }

          main {
            width: min(420px, calc(100vw - 48px));
            text-align: center;
          }

          .mark {
            width: 72px;
            height: 72px;
            margin: 0 auto 24px;
            display: grid;
            place-items: center;
            border-radius: 20px;
            background: #0f766e;
            color: #fff;
            font-size: 30px;
            font-weight: 800;
            box-shadow: 0 20px 45px rgba(15, 118, 110, 0.24);
          }

          h1 {
            margin: 0;
            font-size: 30px;
            line-height: 1.15;
            font-weight: 800;
            letter-spacing: 0;
          }

          p {
            margin: 12px 0 0;
            color: #5d6b82;
            font-size: 15px;
            line-height: 1.6;
          }

          .loader {
            position: relative;
            height: 6px;
            margin: 28px auto 0;
            overflow: hidden;
            border-radius: 999px;
            background: #dbe5ef;
          }

          .loader::before {
            content: "";
            position: absolute;
            inset: 0 auto 0 0;
            width: 45%;
            border-radius: inherit;
            background: #0f766e;
            animation: loading 1.15s ease-in-out infinite;
          }

          @keyframes loading {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(230%);
            }
          }
        </style>
      </head>
      <body>
        <main>
          <div class="mark">BG</div>
          <h1>Bill Gram</h1>
          <p>${message}</p>
          <div class="loader" aria-hidden="true"></div>
        </main>
      </body>
    </html>
  `;
}

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
    show: true,
  });

  if (process.env.NODE_ENV === "development") {
    loadFrontend();
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(getLoadingHtml())}`,
    );
  }

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

function resolveDataDirectory() {
  if (process.env.NODE_ENV === "development") {
    return path.join(__dirname, "../server/data");
  }

  const platform = os.platform();
  const homeDir = os.homedir();

  const resolveDir = (name) => {
    switch (platform) {
      case "win32":
        return path.join(homeDir, "AppData", "Local", name);
      case "darwin":
        return path.join(homeDir, "Library", "Application Support", name);
      case "linux":
        return path.join(homeDir, ".config", name);
      default:
        return path.join(homeDir, `.${name.toLowerCase()}`);
    }
  };

  const newDir = resolveDir("BillGram");
  const legacyDir = resolveDir("Shopkeeper");
  const newDbPath = path.join(newDir, "billgram.db");
  const legacyDbPath = path.join(legacyDir, "shopkeeper.db");

  if (fs.existsSync(newDbPath)) {
    return newDir;
  }

  if (fs.existsSync(legacyDbPath)) {
    return legacyDir;
  }

  return newDir;
}

function getDatabaseFilePath() {
  if (process.env.NODE_ENV === "development") {
    return path.join(resolveDataDirectory(), "shopkeeper.db");
  }

  const dbDir = resolveDataDirectory();
  const legacyDbPath = path.join(dbDir, "shopkeeper.db");
  const newDbPath = path.join(dbDir, "billgram.db");

  if (fs.existsSync(legacyDbPath) && !fs.existsSync(newDbPath)) {
    return legacyDbPath;
  }

  return newDbPath;
}

/**
 * Get the database directory path based on platform
 * This matches the logic in database.js
 */
function getDatabaseDirectory() {
  return resolveDataDirectory();
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackendLogPath() {
  return path.join(app.getPath("userData"), BACKEND_LOG_FILE);
}

function appendBackendLog(message) {
  try {
    const logPath = getBackendLogPath();
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(
      logPath,
      `[${new Date().toISOString()}] ${message}${os.EOL}`,
      "utf-8",
    );
  } catch (error) {
    console.error("Failed to write backend startup log:", error);
  }
}

function checkBackendHealth() {
  return new Promise((resolve) => {
    const request = http.get(BACKEND_HEALTH_URL, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 300);
    });

    request.setTimeout(3000, () => {
      request.destroy();
      resolve(false);
    });

    request.on("error", () => {
      resolve(false);
    });
  });
}

function loadFrontend() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    return;
  }

  const indexPath = path.join(__dirname, "../client/dist/index.html");
  console.log("Loading frontend from:", indexPath);
  console.log("File exists:", fs.existsSync(indexPath));
  mainWindow.loadFile(indexPath);
  scheduleUpdateCheckAfterFrontendLoad();
}

function showStartupError(message) {
  const fullMessage = `${message}\n\nStartup log:\n${getBackendLogPath()}`;

  if (!mainWindow || mainWindow.isDestroyed()) {
    dialog.showErrorBox("Backend Error", fullMessage);
    return;
  }

  mainWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(
      getLoadingHtml(`${message} Please restart the app.`),
    )}`,
  );
  dialog.showErrorBox("Backend Error", fullMessage);
}

async function waitForBackendReady(timeoutMs = BACKEND_START_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await checkBackendHealth()) {
      return true;
    }

    await delay(BACKEND_POLL_INTERVAL_MS);
  }

  return false;
}

function startBackend() {
  let backendPath;
  let backendCwd;
  let command;
  let args;
  const production = process.env.NODE_ENV !== "development";

  if (!production) {
    backendPath = path.join(__dirname, "../server/src/server.js");
    backendCwd = path.join(__dirname, "../server");
    command = "node";
    args = [backendPath];
  } else {
    const bundledServerDir = path.join(process.resourcesPath, "server");
    backendPath = path.join(bundledServerDir, "src/server.js");
    backendCwd = bundledServerDir;
    command = process.execPath;
    args = [backendPath];
  }

  console.log("Starting backend from:", backendPath);
  appendBackendLog(`Starting backend from: ${backendPath}`);
  appendBackendLog(`Backend working directory: ${backendCwd}`);

  if (!fs.existsSync(backendPath)) {
    console.error("Backend file not found at:", backendPath);
    appendBackendLog(`Backend file not found at: ${backendPath}`);
    dialog.showErrorBox(
      "Backend Error",
      `Backend server file not found at: ${backendPath}`,
    );
    return false;
  }

  const dbDir = getDatabaseDirectory();
  console.log("Database directory:", dbDir);
  appendBackendLog(`Database directory: ${dbDir}`);

  const backendEnv = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || "production",
  };

  if (production) {
    backendEnv.ELECTRON_RUN_AS_NODE = "1";
  }

  backendProcess = spawn(command, args, {
    cwd: backendCwd,
    windowsHide: true,
    env: backendEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });

  backendProcess.unref();

  backendProcess.stdout?.on("data", (data) => {
    appendBackendLog(data.toString().trimEnd());
  });

  backendProcess.stderr?.on("data", (data) => {
    appendBackendLog(data.toString().trimEnd());
  });

  backendProcess.on("error", (err) => {
    console.error("Failed to start backend:", err);
    appendBackendLog(`Failed to start backend: ${err.stack || err.message}`);
    dialog.showErrorBox(
      "Backend Error",
      `Failed to start backend server.\n\nStartup log:\n${getBackendLogPath()}`,
    );
  });

  backendProcess.on("exit", (code, signal) => {
    appendBackendLog(`Backend exited with code ${code}, signal ${signal}`);
    if (code !== 0) {
      console.error(`Backend exited with code ${code}`);
    }
  });

  return true;
}

function sendUpdateStatus(payload) {
  lastUpdateStatus = payload;

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update-status", payload);
  }
}

function scheduleUpdateCheckAfterFrontendLoad() {
  if (!updatesEnabled || frontendUpdateCheckScheduled) {
    return;
  }

  frontendUpdateCheckScheduled = true;

  const runCheck = () => {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((error) => {
        console.error("Update check failed:", error);
        sendUpdateStatus({
          status: "error",
          message: error.message,
        });
      });
    }, 2000);
  };

  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  if (mainWindow.webContents.isLoading()) {
    mainWindow.webContents.once("did-finish-load", runCheck);
    return;
  }

  runCheck();
}

function getUpdateServerUrl() {
  const envUrl = String(process.env.UPDATE_SERVER_URL ?? "").trim();

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const configPath = path.join(__dirname, "update-config.json");

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const updateServerUrl = String(config.updateServerUrl ?? "").trim();

    if (!updateServerUrl) {
      return null;
    }

    return updateServerUrl.replace(/\/$/, "");
  } catch (error) {
    console.error("Failed to read update config:", error);
    return null;
  }
}

function setupAutoUpdater() {
  if (process.env.NODE_ENV === "development") {
    return;
  }

  const updateServerUrl = getUpdateServerUrl();

  if (!updateServerUrl) {
    console.warn("Update server URL not configured. Skipping auto-update.");
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  if (process.platform === "win32") {
    autoUpdater.verifyUpdateCodeSignature = async () => null;
  }

  autoUpdater.setFeedURL({
    provider: "generic",
    url: updateServerUrl,
  });
  updatesEnabled = true;

  autoUpdater.on("checking-for-update", () => {
    sendUpdateStatus({ status: "checking" });
  });

  autoUpdater.on("update-available", (info) => {
    sendUpdateStatus({
      status: "available",
      version: info.version,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on("update-not-available", (info) => {
    sendUpdateStatus({
      status: "not-available",
      version: info.version,
    });
  });

  autoUpdater.on("error", (error) => {
    sendUpdateStatus({
      status: "error",
      message: error.message,
    });
  });

  autoUpdater.on("download-progress", (progress) => {
    sendUpdateStatus({
      status: "downloading",
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    sendUpdateStatus({
      status: "downloaded",
      version: info.version,
    });
  });
}

app.whenReady().then(async () => {
  createWindow();
  setupAutoUpdater();

  if (process.env.NODE_ENV !== "development") {
    const alreadyReady = await waitForBackendReady(1000);

    if (!alreadyReady) {
      const backendStarted = startBackend();

      if (!backendStarted) {
        app.quit();
        return;
      }
    }

    const backendReady = await waitForBackendReady();

    if (!backendReady) {
      showStartupError("The backend server did not finish starting.");
      return;
    }

    loadFrontend();
  }

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

ipcMain.handle("get-database-location", async () => getDatabaseFilePath());

ipcMain.handle("backup-database", async () => {
  try {
    const dbPath = getDatabaseFilePath();
    const backupDir = path.join(app.getPath("documents"), "BillGramBackups");

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
    const dbPath = getDatabaseFilePath();

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

ipcMain.handle("move-cursor-to", async (event, { clientX, clientY }) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      return { success: false };
    }

    const screenPoint = resolveScreenPoint(win, clientX, clientY, screen);

    win.webContents.sendInputEvent({
      type: "mouseMove",
      x: Math.round(clientX),
      y: Math.round(clientY),
    });

    moveSystemCursor(screenPoint.x, screenPoint.y);
    return { success: true };
  } catch (error) {
    console.error("Failed to move cursor:", error);
    return { success: false };
  }
});

ipcMain.handle("get-app-version", async () => app.getVersion());

ipcMain.handle("get-update-status", async () => lastUpdateStatus);

ipcMain.handle("check-for-updates", async () => {
  if (process.env.NODE_ENV === "development") {
    return { success: false, error: "Updates are disabled in development" };
  }

  if (!updatesEnabled) {
    return { success: false, error: "Update server is not configured" };
  }

  try {
    const result = await autoUpdater.checkForUpdates();
    return {
      success: true,
      updateInfo: result?.updateInfo ?? null,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("download-update", async () => {
  if (process.env.NODE_ENV === "development") {
    return { success: false, error: "Updates are disabled in development" };
  }

  if (!updatesEnabled) {
    return { success: false, error: "Update server is not configured" };
  }

  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("install-update", async () => {
  if (process.env.NODE_ENV === "development") {
    return { success: false, error: "Updates are disabled in development" };
  }

  if (!updatesEnabled) {
    return { success: false, error: "Update server is not configured" };
  }

  autoUpdater.quitAndInstall(false, true);
  return { success: true };
});
