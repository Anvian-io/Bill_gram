import express from "express";
import { vanController } from "./vanController.js";

const router = express.Router();

// Create a new van
router.post("/", vanController.createVan);

// Get all vans with pagination and filters
router.get("/", vanController.getVans);

// Get active vans (for dropdowns)
router.get("/active", vanController.getActiveVans);

// Get a single van by ID
router.get("/:id", vanController.getVanById);

// Update a van
router.put("/:id", vanController.updateVan);

// Delete a van (soft delete)
router.delete("/:id", vanController.deleteVan);

export default router;
