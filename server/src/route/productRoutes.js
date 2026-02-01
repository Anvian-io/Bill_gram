import express from "express";
import { productController } from "../controllers/productController.js";

const router = express.Router();

// Create a new product
router.post("/", productController.createProduct);

// Get all products with pagination and filters
router.get("/", productController.getProducts);

// Get active products (for dropdowns)
router.get("/active", productController.getActiveProducts);

// Get a single product by ID
router.get("/:id", productController.getProductById);

// Update a product
router.put("/:id", productController.updateProduct);

// Delete a product (soft delete)
router.delete("/:id", productController.deleteProduct);

export default router;
