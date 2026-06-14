const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const http = require("http");

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu");

let mainWindow;
let backendProcess;

const BACKEND_HEALTH_URL = "http://127.0.0.1:3001/api/health";
const BACKEND_START_TIMEOUT_MS = 180000;
const BACKEND_POLL_INTERVAL_MS = 1000;

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
        <title>Shopkeeper</title>
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
          <div class="mark">S</div>
          <h1>Shopkeeper</h1>
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
}

function showStartupError(message) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    dialog.showErrorBox("Backend Error", message);
    return;
  }

  mainWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(
      getLoadingHtml(`${message} Please restart the app.`),
    )}`,
  );
  dialog.showErrorBox("Backend Error", message);
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
    return false;
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

  return true;
}

app.whenReady().then(async () => {
  createWindow();

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
