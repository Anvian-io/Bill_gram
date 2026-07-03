const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const envPath = path.join(projectRoot, ".env");
const configPath = path.join(projectRoot, "electron", "update-config.json");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};

  for (const line of fs.readFileSync(filePath, "utf-8").split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    env[key] = value;
  }

  return env;
}

const fileEnv = loadEnvFile(envPath);
const updateServerUrl = String(
  process.env.UPDATE_SERVER_URL || fileEnv.UPDATE_SERVER_URL || "",
).trim();

if (!updateServerUrl) {
  console.warn(
    "UPDATE_SERVER_URL is not set in .env — auto-update will be disabled in the built app.",
  );
  process.exit(0);
}

const normalizedUrl = updateServerUrl.replace(/\/$/, "");
const config = {
  updateServerUrl: normalizedUrl,
};

fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
console.log(`Update config written: ${normalizedUrl}`);
