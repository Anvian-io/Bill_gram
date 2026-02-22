import express from "express";
import { purchaseController } from "./purchaseController.js";

const router = express.Router();

// Create a new purchase invoice
router.post("/", purchaseController.createPurchase);

// Get all purchases with pagination & filters
router.get("/", purchaseController.getAllPurchases);

// Get active purchases (for dropdowns)
router.get("/active", purchaseController.getActivePurchases);

router.get("/report", purchaseController.getPurchaseReport);

// Get single purchase by ID
router.get("/:id", purchaseController.getPurchaseById);

// Update purchase invoice
router.put("/:id", purchaseController.updatePurchase);

// Delete purchase invoice (soft delete)
router.delete("/:id", purchaseController.deletePurchase);

export default router;
