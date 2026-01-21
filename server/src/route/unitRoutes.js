import express from "express";
import { unitController } from "../controllers/unitController.js";

const router = express.Router();

// Create a new unit
router.post("/", unitController.createUnit);

// Get all units with pagination and filters
router.get("/", unitController.getUnits);

// Get active units (for dropdowns)
router.get("/active", unitController.getActiveUnits);

// Get a single unit by ID
router.get("/:id", unitController.getUnitById);

// Update a unit
router.put("/:id", unitController.updateUnit);

// Delete a unit (soft delete)
router.delete("/:id", unitController.deleteUnit);

// Bulk delete units
router.delete("/", unitController.bulkDeleteUnits);

// Update unit status
router.patch("/:id/status", unitController.updateUnitStatus);

export default router;
