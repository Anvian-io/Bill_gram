const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const envPath = path.join(projectRoot, ".env");
const releasesDir = path.join(projectRoot, "update-server", "releases");
const distDir = path.join(projectRoot, "dist");

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

function getReleaseFiles(sourceDir) {
  return fs
    .readdirSync(sourceDir)
    .filter((file) => {
      const extension = path.extname(file).toLowerCase();

      if (extension === ".exe" || extension === ".blockmap") {
        return true;
      }

      return file === "latest.yml";
    })
    .map((file) => path.join(sourceDir, file));
}

function pickSourceDir() {
  const candidates = [distDir, releasesDir];

  for (const dir of candidates) {
    if (!fs.existsSync(dir)) {
      continue;
    }

    const files = getReleaseFiles(dir);
    const hasYml = files.some((file) => path.basename(file) === "latest.yml");
    const hasExe = files.some((file) => path.extname(file).toLowerCase() === ".exe");

    if (hasYml && hasExe) {
      return dir;
    }
  }

  if (fs.existsSync(distDir)) {
    return distDir;
  }

  return releasesDir;
}

async function uploadRelease() {
  const fileEnv = loadEnvFile(envPath);
  const updateServerUrl = String(
    process.env.UPDATE_SERVER_URL || fileEnv.UPDATE_SERVER_URL || "",
  )
    .trim()
    .replace(/\/$/, "");
  const uploadApiKey = String(
    process.env.UPLOAD_API_KEY || fileEnv.UPLOAD_API_KEY || "",
  ).trim();

  if (!updateServerUrl) {
    console.error("Set UPDATE_SERVER_URL in .env (your Render URL + /releases)");
    process.exit(1);
  }

  if (!uploadApiKey) {
    console.error("Set UPLOAD_API_KEY in .env (same value as on Render)");
    process.exit(1);
  }

  const sourceDir = pickSourceDir();

  if (!fs.existsSync(sourceDir)) {
    console.error('No release files found. Run "npm run build" first.');
    process.exit(1);
  }

  const files = getReleaseFiles(sourceDir);
  const hasLatestYml = files.some(
    (file) => path.basename(file) === "latest.yml",
  );

  if (!hasLatestYml) {
    console.error(
      "latest.yml is missing. Run \"npm run build\" first — the app cannot check for updates without it.",
    );
    process.exit(1);
  }

  if (files.length === 0) {
    console.error(`No .exe / .yml / .blockmap files found in ${sourceDir}`);
    process.exit(1);
  }

  const uploadBaseUrl = updateServerUrl.replace(/\/releases$/, "");
  const formData = new FormData();

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const buffer = fs.readFileSync(filePath);
    formData.append("files", new Blob([buffer]), fileName);
    console.log(`Uploading ${fileName}...`);
  }

  const response = await fetch(`${uploadBaseUrl}/api/upload`, {
    method: "POST",
    headers: {
      "x-api-key": uploadApiKey,
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    console.error("Upload failed:", result.error || response.statusText);
    process.exit(1);
  }

  console.log("\nUpload complete.");
  console.log("Uploaded:", result.uploaded.join(", "));
  if (result.latest?.version) {
    console.log(`Live version on server: v${result.latest.version}`);
  }
}

uploadRelease().catch((error) => {
  console.error("Upload failed:", error.message);
  process.exit(1);
});
