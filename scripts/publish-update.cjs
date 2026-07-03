const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const releasesDir = path.join(projectRoot, "update-server", "releases");

const allowedExtensions = new Set([".exe", ".yml", ".blockmap"]);

function copyReleaseArtifacts() {
  if (!fs.existsSync(distDir)) {
    console.error(
      'Build output not found. Run "npm run build:electron" first.',
    );
    process.exit(1);
  }

  if (!fs.existsSync(releasesDir)) {
    fs.mkdirSync(releasesDir, { recursive: true });
  }

  const files = fs.readdirSync(distDir);
  const releaseFiles = files.filter((file) =>
    allowedExtensions.has(path.extname(file).toLowerCase()),
  );

  if (releaseFiles.length === 0) {
    console.error("No release artifacts (.exe, .yml, .blockmap) found in dist/");
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
    console.warn("Warning: latest.yml was not copied.");
  } else {
    const latestContent = fs.readFileSync(latestYmlPath, "utf-8");
    const versionMatch = latestContent.match(/^version:\s*(.+)$/m);
    console.log(
      `\nPublished version ${versionMatch?.[1]?.trim() ?? "unknown"} to update-server/releases`,
    );
  }

  console.log(
    "\nNext step: start the update server with \"npm run update-server:start\"",
  );
}

copyReleaseArtifacts();
