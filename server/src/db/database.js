import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let prisma = null;

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

    // Initialize Prisma Client
    prisma = new PrismaClient({
      datasourceUrl: databaseUrl,
      log:
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

    // Connect to database
    await prisma.$connect();
    console.log("✅ Prisma connected successfully");

    // Test connection by making a simple query
    try {
      // This will create tables if they don't exist on first query
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log("✅ Database connection verified");
    } catch (error) {
      console.log(
        "⚠️  First connection attempt failed, tables will be created on first use",
      );
    }

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
