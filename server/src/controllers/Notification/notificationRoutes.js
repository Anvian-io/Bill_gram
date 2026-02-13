import express from "express";
import { notificationController } from "./notificationController.js";
// import { authenticateToken } from "../../controllers/authController.js";

const router = express.Router();

// All notification routes require authentication
// router.use(authenticateToken);

// Protected routes
router.post("/", notificationController.createNotification);
router.get("/", notificationController.getUserNotifications);
router.get("/all", notificationController.getAllNotifications); // Admin view
router.put("/:id/read", notificationController.markAsRead);
router.put("/read-all", notificationController.markAllAsRead);
router.get("/unread-count", notificationController.getUnreadCount);

export default router;