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

router.get(
  "/purchase-register-report/pdf",
  purchaseController.downloadPurchaseRegisterPDF
);
router.get(
  "/purchase-register-report/excel",
  purchaseController.downloadPurchaseRegisterExcel
);

// GET /api/purchase/gst - Get all purchases with GST details (paginated)
router.get("/purchase-gst", purchaseController.getPurchaseWithGST);
router.get("/purchase-gst/excel", purchaseController.downloadPurchaseGSTExcel);
router.get("/gstr2/excel", purchaseController.downloadGSTR2Excel);

router.get("/purchase-gst-monthly", purchaseController.getPurchaseGSTMonthly);
router.get(
  "/purchase-gst-monthly/excel",
  purchaseController.downloadPurchaseGSTMonthlyExcel,
);
router.get("/b2b", purchaseController.getPurchaseB2B);
router.get("/b2b/excel", purchaseController.downloadPurchaseB2BExcel);

// New history routes
router.get("/history/all", purchaseController.getAllPurchaseReportHistory);
router.get("/history/:id/pdf", purchaseController.downloadPurchaseReportHistoryPDF);
router.get("/history/:id/excel", purchaseController.downloadPurchaseReportHistoryExcel);

router.get("/:id/bill-preview", purchaseController.getPurchaseBillPreview);
router.get("/:id/bill-preview/pdf", purchaseController.downloadPurchaseBillPreviewPDF);

// Get single purchase by ID
router.get("/:id", purchaseController.getPurchaseById);

// Update purchase invoice
router.put("/:id", purchaseController.updatePurchase);

// Delete purchase invoice (soft delete)
router.delete("/:id", purchaseController.deletePurchase);

export default router;
