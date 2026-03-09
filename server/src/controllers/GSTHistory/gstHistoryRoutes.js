import express from "express";
import { gstHistoryController } from "./gstHistoryController.js";

const router = express.Router();

router.get("/all", gstHistoryController.getAllGSTReportHistory);

export default router;
