import express from "express";
import cors from "cors";
import { initializeDatabase, getDatabaseLocation } from "./db/database.js";
import productGroupRoutes from "./controllers/Product_Group/productGroupRoutes.js";
import authRoutes from "./controllers/Auth/auth.js";
import unitRoutes from "./controllers/Unit/unitRoutes.js";
import productCompanyRoutes from "./controllers/Product_Company/productCompanyRoutes.js";
import salesmanRoutes from "./controllers/Salesman/salesmanRoutes.js";
import customerRoutes from "./controllers/Customer/customerRoutes.js";
import areaRoutes from "./controllers/Area/areaRoutes.js";
import vanRoutes from "./controllers/Van/vanRoutes.js";
import accountRoutes from "./controllers/Account/accountRoutes.js";
import productRoutes from "./controllers/Product/productRoutes.js";
import imageRoutes from "./controllers/Image/imageRoutes.js";
import purchaseRoute from "./controllers/Purchase/purchaseRoutes.js";
import supplierRoutes from "./controllers/Supplier/supplierRoutes.js";
import salesRoutes from "./controllers/Sales/salesRoutes.js";

import notificationRoutes from "./controllers/Notification/notificationRoutes.js"; // Add this
import { createServer } from "http";
import { notificationController } from "./controllers/Notification/notificationController.js"; // Add this

const app = express();
const PORT = 3001;

// Create HTTP server for WebSocket
const server = createServer(app);

// Middleware
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
    app.use("/api/accounts", accountRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/images", imageRoutes);
    app.use("/api/notifications", notificationRoutes); // Add this
    app.use("/api/purchases", purchaseRoute); // Add this
        app.use("/api/suppliers", supplierRoutes);

    // Health check
    app.get("/api/health", (req, res) => {
      res.json({
        status: "Backend running",
        database: "Connected",
        location: dbLocation,
        timestamp: new Date().toISOString(),
      });
    });

    // Setup WebSocket server
    notificationController.setupWebSocketServer(server);

    // Start server
    server.listen(PORT, () => {
      console.log(`✅ Backend server running on http://localhost:${PORT}`);
      console.log(`✅ WebSocket server running on ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();