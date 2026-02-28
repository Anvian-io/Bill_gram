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

router.get(
  "/summary-pdf-data",
  purchaseController.getPurchaseSummaryReport_pdf_data,
);
router.get("/register-pdf-data", purchaseController.getPurchaseRegisterPDFData);

// New route for PDF download
router.get(
  "/purchase-summary-report/pdf",
  purchaseController.downloadPurchaseSummaryReportPDF,
);

router.get(
  "/purchase-summary-report/excel",
  purchaseController.downloadPurchaseSummaryReportExcel,
);

// GET /api/purchase/gst - Get all purchases with GST details (paginated)
router.get("/purchase-gst", purchaseController.getPurchaseWithGST);

router.get("/purchase-gst-monthly", purchaseController.getPurchaseGSTMonthly);

// New history routes
router.get("/history/all", purchaseController.getAllPurchaseReportHistory);
router.get("/history/:id/pdf", purchaseController.downloadPurchaseReportHistoryPDF);
router.get("/history/:id/excel", purchaseController.downloadPurchaseReportHistoryExcel);

// Get single purchase by ID
router.get("/:id", purchaseController.getPurchaseById);

// Update purchase invoice
router.put("/:id", purchaseController.updatePurchase);

// Delete purchase invoice (soft delete)
router.delete("/:id", purchaseController.deletePurchase);

export default router;
