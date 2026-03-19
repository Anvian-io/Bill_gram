import cors from "cors";
import express from "express";
import { connectToDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: error.message || "Internal server error" });
});

connectToDatabase()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
