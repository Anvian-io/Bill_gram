import express from "express";
import { supplierController } from "../controllers/supplierController.js";

const router = express.Router();

// Create a new supplier
router.post("/", supplierController.createSupplier);

// Get all suppliers with pagination and filters
router.get("/", supplierController.getSuppliers);

// Get active suppliers (for dropdowns)
router.get("/active", supplierController.getActiveSuppliers);

// Get a single supplier by ID
router.get("/:id", supplierController.getSupplierById);

// Update a supplier
router.put("/:id", supplierController.updateSupplier);

// Delete a supplier (soft delete)
router.delete("/:id", supplierController.deleteSupplier);

export default router;
