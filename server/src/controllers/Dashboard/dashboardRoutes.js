import express from "express";
import {
  getDashboardKPIs,
  getMonthlyTrend,
  getInventorySummary,
  getTopCustomers,
  getTopProducts,
  getSalesmanPerformance,
  getSalesStatusDistribution,
  getRecentActivity,
} from "./dashboardController.js";

const router = express.Router();

router.get("/kpis", getDashboardKPIs);
router.get("/monthly-trend", getMonthlyTrend);
router.get("/inventory-summary", getInventorySummary);
router.get("/top-customers", getTopCustomers);
router.get("/top-products", getTopProducts);
router.get("/salesman-performance", getSalesmanPerformance);
router.get("/sales-status-distribution", getSalesStatusDistribution);
router.get("/recent-activity", getRecentActivity);

export default router;
