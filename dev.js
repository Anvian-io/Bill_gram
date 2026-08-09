const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting BillGram in development mode...\n");

// Start client (React)
const clientProcess = spawn("npm", ["run", "dev"], {
  cwd: path.join(__dirname, "client"),
  stdio: "inherit",
  shell: true,
});

// Wait 2 seconds for client to start, then start server
setTimeout(() => {
  const serverProcess = spawn("npm", ["run", "dev"], {
    cwd: path.join(__dirname, "server"),
    stdio: "inherit",
    shell: true,
  });

  // Wait 2 more seconds for server to start, then start Electron
  setTimeout(() => {
    const electronProcess = spawn("electron", ["electron/main.js"], {
      cwd: __dirname,
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: "development",
      },
    });

    electronProcess.on("error", (err) => {
      console.error("Failed to start Electron:", err);
    });
  }, 2000);
}, 2000);

// Handle cleanup
process.on("SIGINT", () => {
  console.log("\n\n🛑 Shutting down development servers...");
  process.exit();
});
