import express from "express";
import { salesmanController } from "./salesmanController.js";

const router = express.Router();

// Create a new salesman
router.post("/", salesmanController.createSalesman);

// Get all salesmen with pagination and filters
router.get("/", salesmanController.getSalesmen);

// Get active salesmen (for dropdowns)
router.get("/active", salesmanController.getActiveSalesmen);

// Get a single salesman by ID
router.get("/:id", salesmanController.getSalesmanById);

// Update a salesman
router.put("/:id", salesmanController.updateSalesman);

// Delete a salesman (soft delete)
router.delete("/:id", salesmanController.deleteSalesman);

export default router;
