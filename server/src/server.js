import express from "express";
import cors from "cors";
import { initializeDatabase, getDatabaseLocation } from "./db/database.js";
import productGroupRoutes from "./route/productGroupRoutes.js";
import authRoutes from "./route/auth.js";
import unitRoutes from "./route/unitRoutes.js";
import productCompanyRoutes from "./route/productCompanyRoutes.js";
import salesmanRoutes from "./route/salesmanRoutes.js";
import customerRoutes from "./route/customerRoutes.js";
import areaRoutes from "./route/areaRoutes.js";
import vanRoutes from "./route/vanRoutes.js";

const app = express();
const PORT = 3001;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// Initialize database and then start server
const startServer = async () => {
  try {
    console.log("🚀 Starting server initialization...");

    // Initialize database (this will create it if it doesn't exist)
    await initializeDatabase();

    // Get database location for debugging
    const dbLocation = getDatabaseLocation();
    console.log(`📁 Final database location: ${dbLocation}`);

    // Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/product-groups", productGroupRoutes);
    app.use("/api/units", unitRoutes);
    app.use("/api/product-companies", productCompanyRoutes);
    app.use("/api/salesmen", salesmanRoutes);
    app.use("/api/customers", customerRoutes);
    app.use("/api/areas", areaRoutes);
    app.use("/api/vans", vanRoutes);

    // Health check
    app.get("/api/health", (req, res) => {
      res.json({
        status: "Backend running",
        database: "Connected",
        location: dbLocation,
        timestamp: new Date().toISOString(),
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
