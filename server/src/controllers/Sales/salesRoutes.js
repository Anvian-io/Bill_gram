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

router.get("/register-pdf-data", salesController.getSalesRegisterPDFData);

router.get("/area-pdf-data", salesController.getAreaWisePDFData);

router.get("/salesman-pdf-data", salesController.getSalesmanWisePDFData);

router.get("/sales-gst", salesController.getSalesWithGST);

router.get("/sales-gst-montly", salesController.getSalesGSTMonthly);

// Get single sales by ID
router.get("/:id", salesController.getSaleById);

// Update sales invoice
router.put("/:id", salesController.updateSale);

// Delete sales invoice (soft delete)
router.delete("/:id", salesController.deleteSale);

export default router;
