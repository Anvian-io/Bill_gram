const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = path.join(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const releasesDir = path.join(projectRoot, "update-server", "releases");

function shouldCopyReleaseFile(fileName) {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".exe" || extension === ".blockmap") {
    return true;
  }

  return fileName === "latest.yml";
}

function copyReleaseArtifacts() {
  if (!fs.existsSync(distDir)) {
    console.error('Build output not found. Run "npm run build" first.');
    process.exit(1);
  }

  if (!fs.existsSync(releasesDir)) {
    fs.mkdirSync(releasesDir, { recursive: true });
  }

  const files = fs.readdirSync(distDir);
  const releaseFiles = files.filter(shouldCopyReleaseFile);

  if (releaseFiles.length === 0) {
    console.error("No release artifacts found in dist/");
    process.exit(1);
  }

  for (const file of releaseFiles) {
    const sourcePath = path.join(distDir, file);
    const targetPath = path.join(releasesDir, file);
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied ${file}`);
  }

  const latestYmlPath = path.join(releasesDir, "latest.yml");
  if (!fs.existsSync(latestYmlPath)) {
    console.error("latest.yml was not copied.");
    process.exit(1);
  }

  const latestContent = fs.readFileSync(latestYmlPath, "utf-8");
  const versionMatch = latestContent.match(/^version:\s*(.+)$/m);
  console.log(
    `\nPrepared version ${versionMatch?.[1]?.trim() ?? "unknown"} in update-server/releases`,
  );
}

copyReleaseArtifacts();

console.log("\nUploading to Render...");
const uploadResult = spawnSync("node", [path.join(__dirname, "upload-release.cjs")], {
  cwd: projectRoot,
  stdio: "inherit",
  env: process.env,
});

if (uploadResult.status !== 0) {
  process.exit(uploadResult.status ?? 1);
}

console.log(
  "\nCommit latest.yml so Render keeps it after redeploys:",
);
console.log("  git add update-server/releases/latest.yml");
console.log('  git commit -m "chore: update latest.yml"');
console.log("\nVerify:");
console.log("  npm run verify:update-server");
