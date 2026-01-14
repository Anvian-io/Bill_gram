// server/src/db/database.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

export async function initializeDatabase() {
  try {
    console.log("🔄 Initializing database...");

    // Use absolute path in server directory
    const dbPath = path.join(__dirname, "..", "..", "shopkeeper.db");
    console.log(`📁 Database location: ${dbPath}`);

    // Open database - this will create the file if it doesn't exist
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    console.log("✅ Database connection established");

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
