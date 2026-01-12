import express from "express";
import cors from "cors";
import { initializeDatabase } from "./db/database.js";
import authRoutes from "./route/auth.js";

const app = express();
const PORT = 3001;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Initialize database and then start server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();

    // Routes
    app.use("/api/auth", authRoutes);

    // Health check
    app.get("/api/health", (req, res) => {
      res.json({
        status: "Backend running",
        database: "Connected",
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
