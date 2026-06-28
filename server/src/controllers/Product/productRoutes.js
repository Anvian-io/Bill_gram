import express from "express";
import { productController } from "./productController.js";

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

// Lock or unlock a product
router.patch("/:id/lock", productController.toggleProductLock);

// Get batches associated with a product
router.get("/:id/batches", productController.getProductBatches);

// Pin or unpin a batch for sales/purchase selection
router.patch("/:id/batches/:batchId/pin", productController.pinProductBatch);

// Batch-linked transaction history for a product
router.get("/:id/purchase-history", productController.getProductPurchaseHistory);
router.get("/:id/sales-history", productController.getProductSalesHistory);

export default router;
