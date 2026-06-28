#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.join(__dirname, "..");
const CLIENT_DIR = path.join(SERVER_ROOT, "node_modules", ".prisma", "client");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanPrismaTempFiles() {
  if (!fs.existsSync(CLIENT_DIR)) {
    return;
  }

  for (const file of fs.readdirSync(CLIENT_DIR)) {
    if (file.includes(".tmp")) {
      try {
        fs.unlinkSync(path.join(CLIENT_DIR, file));
        console.log(`🧹 Removed stale temp file: ${file}`);
      } catch {
        // Ignore files still locked by another process.
      }
    }
  }
}

function removePrismaClientDir() {
  if (!fs.existsSync(CLIENT_DIR)) {
    return;
  }

  try {
    fs.rmSync(CLIENT_DIR, { recursive: true, force: true });
    console.log("🧹 Cleared .prisma/client before regenerate");
  } catch {
    // Fall back to temp cleanup only.
    cleanPrismaTempFiles();
  }
}

async function runGenerate(attempt, maxAttempts) {
  console.log(`🔄 Generating Prisma client (attempt ${attempt}/${maxAttempts})...`);

  execSync("npx prisma generate", {
    stdio: "inherit",
    cwd: SERVER_ROOT,
    env: process.env,
  });
}

async function main() {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt === 1) {
        cleanPrismaTempFiles();
      } else {
        removePrismaClientDir();
        await sleep(1500 * attempt);
      }

      await runGenerate(attempt, maxAttempts);
      console.log("✅ Prisma client generated successfully!");
      return;
    } catch (error) {
      const message = error?.message || String(error);
      const isPermissionError =
        message.includes("EPERM") || message.includes("operation not permitted");

      if (!isPermissionError || attempt === maxAttempts) {
        console.error("\n❌ Failed to generate Prisma client.");
        console.error(
          "Stop the running backend/dev server first, then run: npm run prisma:generate",
        );
        console.error(
          "If the project is in OneDrive, pause sync or exclude node_modules/.prisma from sync.",
        );
        process.exit(1);
      }

      console.warn(
        `\n⚠️  Prisma engine file is locked. Retrying in ${1.5 * attempt}s...`,
      );
      await sleep(1500 * attempt);
    }
  }
}

main();
