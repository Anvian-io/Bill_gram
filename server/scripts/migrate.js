#!/usr/bin/env node

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDatabasePath() {
  const appName = "Shopkeeper";
  let dbDir;

  const platform = os.platform();
  const homeDir = os.homedir();

  switch (platform) {
    case "win32":
      dbDir = path.join(homeDir, "AppData", "Local", appName);
      break;
    case "darwin":
      dbDir = path.join(homeDir, "Library", "Application Support", appName);
      break;
    case "linux":
      dbDir = path.join(homeDir, ".config", appName);
      break;
    default:
      dbDir = path.join(homeDir, `.${appName.toLowerCase()}`);
  }

  if (!fs.existsSync(dbDir)) {
    console.log(`📁 Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return path.join(dbDir, "shopkeeper.db");
}

async function main() {
  try {
    console.log("🚀 Running migration with AppData path...");

    // Get the AppData database path
    const dbPath = getDatabasePath();
    console.log(`📁 Database location: ${dbPath}`);

    // Convert Windows path to file:// URL format
    const databaseUrl = `file:${dbPath.replace(/\\/g, "/")}`;
    console.log(`🔗 Setting DATABASE_URL: ${databaseUrl}`);

    // Set environment variable for Prisma
    process.env.DATABASE_URL = databaseUrl;

    // Check if migration name was provided as argument
    const migrationName = process.argv[2] || "init";

    console.log(`📝 Creating migration: ${migrationName}`);

    // Use prisma migrate dev to create and apply migration
    execSync(`npx prisma migrate dev --name ${migrationName}`, {
      stdio: "inherit",
      env: process.env,
      cwd: process.cwd(),
    });

    console.log("✅ Migration completed successfully!");
    console.log(`💾 Database is now at: ${dbPath}`);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

main();
