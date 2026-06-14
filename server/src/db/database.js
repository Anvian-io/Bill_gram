import { PrismaClient } from "@prisma/client";
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.join(__dirname, "..", "..");

let prisma = null;

function runPrismaMigrations() {
  const prismaCli = path.join(SERVER_ROOT, "node_modules", "prisma", "build", "index.js");

  if (!fs.existsSync(prismaCli)) {
    throw new Error(
      `Prisma CLI not found at ${prismaCli}. Ensure server dependencies are installed.`,
    );
  }

  console.log("🔄 Applying database migrations...");

  const result = spawnSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    cwd: SERVER_ROOT,
    env: process.env,
    encoding: "utf-8",
  });

  if (result.stdout) {
    console.log(result.stdout.trimEnd());
  }

  if (result.stderr) {
    console.error(result.stderr.trimEnd());
  }

  if (result.status !== 0) {
    throw new Error(
      `Prisma migrate deploy failed with exit code ${result.status ?? "unknown"}`,
    );
  }

  console.log("✅ Database migrations applied");
}

async function ensureSubscriptionExpiryColumn(client) {
  const columns = await client.$queryRawUnsafe(`PRAGMA table_info("users")`);
  const hasSubscriptionExpiryColumn = columns.some(
    (column) => column.name === "subscription_expires_at",
  );

  if (!hasSubscriptionExpiryColumn) {
    await client.$executeRawUnsafe(
      `ALTER TABLE "users" ADD COLUMN "subscription_expires_at" DATETIME`
    );
    console.log("Added subscription expiry column to users table");
  }
}

/**
 * Get the appropriate database path based on platform
 * Always use OS-specific AppData/Local directory
 */
export function getDatabasePath() {
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

  // Ensure directory exists
  if (!fs.existsSync(dbDir)) {
    console.log(`📁 Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return path.join(dbDir, "shopkeeper.db");
}

/**
 * Initialize the database connection
 */
export async function initializeDatabase() {
  try {
    console.log("🚀 Initializing database...");

    const dbPath = getDatabasePath();
    console.log(`📁 Database location: ${dbPath}`);

    // Convert Windows path to file:// URL format for Prisma
    const databaseUrl = `file:${dbPath.replace(/\\/g, "/")}`;

    // Set environment variable for Prisma
    process.env.DATABASE_URL = databaseUrl;
    console.log(`🔗 DATABASE_URL: ${databaseUrl}`);

    // Apply pending Prisma migrations (creates schema on first run)
    runPrismaMigrations();

    // Initialize Prisma Client
    prisma = new PrismaClient({
      datasourceUrl: databaseUrl,
      log:
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

    // Connect to database
    await prisma.$connect();
    console.log("✅ Prisma connected successfully");

    // Verify connection after migrations
    await prisma.$queryRaw`SELECT 1 as test`;
    await ensureSubscriptionExpiryColumn(prisma);
    console.log("✅ Database connection verified");

    console.log("✅ Database initialization completed!");
    console.log(`💾 Database ready at: ${dbPath}`);

    return prisma;
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    throw error;
  }
}

/**
 * Get the Prisma client instance
 */
export function getDb() {
  if (!prisma) {
    throw new Error(
      "Database not initialized! Call initializeDatabase() first.",
    );
  }
  return prisma;
}

/**
 * Get database location for debugging
 */
export function getDatabaseLocation() {
  return getDatabasePath();
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    console.log("✅ Database connection closed");
  }
}
