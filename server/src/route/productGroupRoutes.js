//server/src/route/productGroupRoutes.js
import express from "express";
import { productGroupController } from "../controllers/productGroupController.js";

const router = express.Router();

// Create a new product group
router.post("/", productGroupController.createProductGroup);

// Get all product groups with pagination and filters
router.get("/", productGroupController.getProductGroups);

// Get a single product group by ID
router.get("/:id", productGroupController.getProductGroupById);

// Update a product group
router.put("/:id", productGroupController.updateProductGroup);

// Delete a product group (soft delete)
router.delete("/:id", productGroupController.deleteProductGroup);

// Bulk delete product groups
router.delete("/", productGroupController.bulkDeleteProductGroups);

// Update product group status
router.patch("/:id/status", productGroupController.updateProductGroupStatus);

export default router;
