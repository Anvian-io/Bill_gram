import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

/**
 * Get the appropriate database path based on environment and platform
 * Automatically detects the correct AppData/Local directory
 */
function getDatabasePath() {
  const appName = "Shopkeeper"; // Your app name
  let dbDir;

  if (process.env.NODE_ENV === "development") {
    // Development: Use local data directory in project
    dbDir = path.join(__dirname, "..", "..", "data");
  } else {
    // Production: Use platform-specific AppData directory
    const platform = os.platform();
    const homeDir = os.homedir();

    switch (platform) {
      case "win32": // Windows
        dbDir = path.join(homeDir, "AppData", "Local", appName);
        break;
      case "darwin": // macOS
        dbDir = path.join(homeDir, "Library", "Application Support", appName);
        break;
      case "linux": // Linux
        dbDir = path.join(homeDir, ".config", appName);
        break;
      default:
        // Fallback
        dbDir = path.join(homeDir, `.${appName.toLowerCase()}`);
    }
  }

  // Ensure directory exists
  if (!fs.existsSync(dbDir)) {
    console.log(`📁 Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return path.join(dbDir, "shopkeeper.db");
}

export async function initializeDatabase() {
  try {
    console.log("🔄 Initializing database...");

    const dbPath = getDatabasePath();
    console.log(`📁 Database location: ${dbPath}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "production"}`);
    console.log(`💻 Platform: ${os.platform()}`);

    // Open database - this will create the file if it doesn't exist
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    console.log("✅ Database connection established");

    // Enable foreign keys
    await db.run("PRAGMA foreign_keys = ON");

    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        shop_name TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    console.log("✅ Tables created successfully");
    console.log(`💾 Database ready at: ${dbPath}`);

    return db;
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    console.error("Database not initialized!");
    return null;
  }
  return db;
}

export function getDatabaseLocation() {
  return getDatabasePath();
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
    console.log("✅ Database connection closed");
  }
}
