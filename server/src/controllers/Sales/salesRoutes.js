import express from "express";
import { salesController } from "./salesController.js";

const router = express.Router();

// Create a new sales invoice
router.post("/", salesController.createSale);

// Get all sales with pagination & filters
router.get("/", salesController.getAllSales);

// Get active sales (for dropdowns)
router.get("/active", salesController.getActiveSales);

router.get("/report", salesController.getSalesReport);

router.get("/report/area-wise", salesController.getAreaWiseSalesReport);

router.get("/report/salesman-wise", salesController.getSalesmanWiseSalesReport);

router.get("/summary-pdf-data", salesController.getSalesSummaryReportPDFData);

router.get("/sales-summary-report/pdf", salesController.downloadSalesSummaryReportPDF);

router.get("/sales-summary-report/excel", salesController.downloadSalesSummaryReportExcel);

router.get("/register-pdf-data", salesController.getSalesRegisterPDFData);

router.get(
  "/sales-register-report/pdf",
  salesController.downloadSalesRegisterReportPDF,
);

router.get(
  "/sales-register-report/excel",
  salesController.downloadSalesRegisterReportExcel,
);

router.get("/area-pdf-data", salesController.getAreaWisePDFData);

router.get("/area-wise-report/pdf", salesController.downloadAreaWiseReportPDF);

router.get(
  "/area-wise-report/excel",
  salesController.downloadAreaWiseReportExcel,
);

router.get("/salesman-pdf-data", salesController.getSalesmanWisePDFData);

router.get(
  "/salesman-wise-report/pdf",
  salesController.downloadSalesmanWiseReportPDF,
);

router.get(
  "/salesman-wise-report/excel",
  salesController.downloadSalesmanWiseReportExcel,
);

router.get("/sales-gst", salesController.getSalesWithGST);

router.get("/sales-gst-montly", salesController.getSalesGSTMonthly);

// Get all sales report history with filters & pagination
router.get("/history/all", salesController.getAllSalesReportHistory);

// Download specific history record as PDF
router.get("/history/:id/pdf", salesController.downloadSalesReportHistoryPDF);

// Download specific history record as Excel
router.get("/history/:id/excel", salesController.downloadSalesReportHistoryExcel);

// Get single sales by ID
router.get("/:id", salesController.getSaleById);

// Update sales invoice
router.put("/:id", salesController.updateSale);

// Delete sales invoice (soft delete)
router.delete("/:id", salesController.deleteSale);

router.get("/:id/bill-preview", salesController.getSalesBillPreview); // new route


export default router;
