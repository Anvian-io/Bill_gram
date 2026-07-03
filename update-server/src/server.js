import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const releasesDir = path.join(__dirname, "../releases");

const app = express();
const port = Number(process.env.PORT || 4000);
const uploadApiKey = process.env.UPLOAD_API_KEY || "";

if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: releasesDir,
    filename: (_req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 500,
  },
});

function readLatestVersion() {
  const latestYmlPath = path.join(releasesDir, "latest.yml");

  if (!fs.existsSync(latestYmlPath)) {
    return null;
  }

  const content = fs.readFileSync(latestYmlPath, "utf-8");
  const versionMatch = content.match(/^version:\s*(.+)$/m);
  const releaseDateMatch = content.match(/^releaseDate:\s*(.+)$/m);
  const pathMatch = content.match(/^path:\s*(.+)$/m);

  return {
    version: versionMatch?.[1]?.trim() ?? null,
    releaseDate: releaseDateMatch?.[1]?.trim() ?? null,
    installer: pathMatch?.[1]?.trim() ?? null,
  };
}

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "shopkeeper-update-server",
    releasesPath: "/releases",
  });
});

app.get("/api/info", (_req, res) => {
  const latest = readLatestVersion();
  const files = fs
    .readdirSync(releasesDir)
    .filter((file) => !file.startsWith("."));

  res.json({
    latest,
    files,
    releasesUrl: `/releases`,
  });
});

app.use(
  "/releases",
  express.static(releasesDir, {
    setHeaders: (res, filePath) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

      if (filePath.endsWith(".yml")) {
        res.setHeader("Content-Type", "text/yaml; charset=utf-8");
      }
    },
  }),
);

app.post("/api/upload", upload.array("files"), (req, res) => {
  if (!uploadApiKey) {
    return res.status(503).json({
      success: false,
      error: "Upload is disabled. Set UPLOAD_API_KEY in update-server/.env",
    });
  }

  const providedKey = req.header("x-api-key");

  if (providedKey !== uploadApiKey) {
    return res.status(401).json({
      success: false,
      error: "Invalid upload API key",
    });
  }

  const uploadedFiles = (req.files || []).map((file) => file.filename);

  if (uploadedFiles.length === 0) {
    return res.status(400).json({
      success: false,
      error: "No files uploaded. Use form field name 'files'.",
    });
  }

  res.json({
    success: true,
    uploaded: uploadedFiles,
    latest: readLatestVersion(),
  });
});

app.listen(port, () => {
  console.log(`Shopkeeper update server running on http://localhost:${port}`);
  console.log(`Release files served from http://localhost:${port}/releases`);
  console.log(`Health check: http://localhost:${port}/health`);
});
