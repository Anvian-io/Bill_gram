const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const envPath = path.join(projectRoot, ".env");

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

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

async function verifyUpdateServer() {
  const fileEnv = loadEnvFile(envPath);
  const updateServerUrl = String(
    process.env.UPDATE_SERVER_URL || fileEnv.UPDATE_SERVER_URL || "",
  )
    .trim()
    .replace(/\/$/, "");

  if (!updateServerUrl) {
    fail("Set UPDATE_SERVER_URL in .env");
    return;
  }

  const baseUrl = updateServerUrl.replace(/\/releases$/, "");
  const latestUrl = `${updateServerUrl}/latest.yml?noCache=${Date.now()}`;

  console.log(`Checking ${latestUrl}`);

  const latestResponse = await fetch(latestUrl);

  if (!latestResponse.ok) {
    fail(
      `\nlatest.yml is missing on the server (HTTP ${latestResponse.status}).\nRun: npm run build && npm run publish:update`,
    );
    return;
  }

  const latestText = await latestResponse.text();
  const versionMatch = latestText.match(/^version:\s*(.+)$/m);
  const pathMatch = latestText.match(/^path:\s*(.+)$/m);
  const installerName = pathMatch?.[1]?.trim();

  console.log(`latest.yml OK — version ${versionMatch?.[1]?.trim() ?? "unknown"}`);

  if (!installerName) {
    console.warn("Installer path missing from latest.yml");
    return;
  }

  const installerUrl = `${updateServerUrl}/${encodeURIComponent(installerName)}`;
  const installerResponse = await fetch(installerUrl, { method: "HEAD" });
  await installerResponse.arrayBuffer().catch(() => null);

  if (!installerResponse.ok) {
    fail(
      `\nInstaller missing on server (HTTP ${installerResponse.status}): ${installerName}\nRun: npm run upload:release`,
    );
    return;
  }

  const infoResponse = await fetch(`${baseUrl}/api/info`);
  const info = await infoResponse.json();
  console.log("Server files:", info.files?.join(", ") || "(none)");
  console.log("\nUpdate server is ready.");
}

verifyUpdateServer().catch((error) => {
  fail(`Verification failed: ${error.message}`);
});
