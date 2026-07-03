#!/usr/bin/env node

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDatabasePath() {
  const appName = "BillGram";
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

  return path.join(dbDir, "billgram.db");
}

async function main() {
  try {
    console.log("🚀 Pushing schema to AppData database...");

    const dbPath = getDatabasePath();
    console.log(`📁 Database location: ${dbPath}`);

    const databaseUrl = `file:${dbPath.replace(/\\/g, "/")}`;
    console.log(`🔗 Setting DATABASE_URL: ${databaseUrl}`);

    process.env.DATABASE_URL = databaseUrl;

    // Use prisma db push for quick updates
    execSync(`npx prisma db push --accept-data-loss`, {
      stdio: "inherit",
      env: process.env,
      cwd: process.cwd(),
    });

    console.log("✅ Schema pushed successfully!");
    console.log(`💾 Database is now at: ${dbPath}`);
  } catch (error) {
    console.error("❌ Failed to push schema:", error.message);
    process.exit(1);
  }
}

main();
