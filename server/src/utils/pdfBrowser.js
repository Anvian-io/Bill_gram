import fs from "fs";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

const windowsExecutableCandidates = () => {
  const programFiles = process.env.PROGRAMFILES || "C:\\Program Files";
  const programFilesX86 = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
  const localAppData = process.env.LOCALAPPDATA || "";

  return [
    path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(localAppData, "Microsoft", "Edge", "Application", "msedge.exe"),
  ].filter(Boolean);
};

const resolveBrowserExecutablePath = () => {
  const envPath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_EXECUTABLE_PATH ||
    process.env.CHROME_PATH ||
    "";

  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  if (process.platform === "win32") {
    const match = windowsExecutableCandidates().find((candidate) =>
      fs.existsSync(candidate),
    );
    if (match) return match;
  }

  return undefined;
};

export const launchPdfBrowser = async (puppeteer) => {
  const executablePath = resolveBrowserExecutablePath();
  const launchOptions = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  if (!isProduction) {
    return puppeteer.launch(launchOptions);
  }

  try {
    return await puppeteer.launch(launchOptions);
  } catch (error) {
    if (!executablePath) {
      const fallback = resolveBrowserExecutablePath();
      if (fallback) {
        return puppeteer.launch({
          ...launchOptions,
          executablePath: fallback,
        });
      }
    }
    throw error;
  }
};
