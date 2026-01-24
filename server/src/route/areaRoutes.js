import express from "express";
import { areaController } from "../controllers/areaController.js";

const router = express.Router();

// Create a new area
router.post("/", areaController.createArea);

// Get all areas with pagination and filters
router.get("/", areaController.getAreas);

// Get active areas (for dropdowns)
router.get("/active", areaController.getActiveAreas);

// Get a single area by ID
router.get("/:id", areaController.getAreaById);

// Update an area
router.put("/:id", areaController.updateArea);

// Delete an area (soft delete)
router.delete("/:id", areaController.deleteArea);

export default router;
