const { execFileSync } = require("child_process");

let setCursorPosNative = null;

if (process.platform === "win32") {
  try {
    const koffi = require("koffi");
    const user32 = koffi.load("user32.dll");
    setCursorPosNative = user32.func("bool __stdcall SetCursorPos(int x, int y)");
  } catch (error) {
    console.error("Failed to load user32 SetCursorPos via koffi:", error);
  }
}

function moveSystemCursor(screenX, screenY) {
  const x = Math.round(screenX);
  const y = Math.round(screenY);

  if (setCursorPosNative) {
    setCursorPosNative(x, y);
    return true;
  }

  if (process.platform === "win32") {
    const script = `Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class C { [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y); }'; [C]::SetCursorPos(${x}, ${y})`;
    try {
      execFileSync(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Sta", "-Command", script],
        { windowsHide: true, timeout: 2000 },
      );
      return true;
    } catch (error) {
      console.error("SetCursorPos PowerShell fallback failed:", error);
      return false;
    }
  }

  if (process.platform === "darwin") {
    try {
      execFileSync(
        "osascript",
        [
          "-e",
          `tell application "System Events" to set the mouse location to {${x}, ${y}}`,
        ],
        { timeout: 2000 },
      );
      return true;
    } catch (error) {
      console.error("macOS cursor move failed:", error);
      return false;
    }
  }

  try {
    execFileSync("xdotool", ["mousemove", String(x), String(y)], {
      timeout: 2000,
    });
    return true;
  } catch (error) {
    console.error("xdotool cursor move failed:", error);
    return false;
  }
}

function resolveScreenPoint(win, clientX, clientY, screen) {
  const contentBounds = win.getContentBounds();
  const zoomFactor = win.webContents.getZoomFactor() || 1;

  const dipX = contentBounds.x + clientX * zoomFactor;
  const dipY = contentBounds.y + clientY * zoomFactor;

  if (screen?.dipToScreenPoint) {
    try {
      return screen.dipToScreenPoint({ x: dipX, y: dipY });
    } catch {
      // fall through
    }
  }

  const display = screen?.getDisplayMatching?.({ x: dipX, y: dipY });
  const scaleFactor = display?.scaleFactor || 1;
  return {
    x: Math.round(dipX * scaleFactor),
    y: Math.round(dipY * scaleFactor),
  };
}

module.exports = {
  moveSystemCursor,
  resolveScreenPoint,
};
