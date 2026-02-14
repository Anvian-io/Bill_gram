import { getPrismaOrFail, sendResponse, asyncHandler, statusType } from "../../utils/index.js";
import { 
  createNotification as createNotificationHelper,
  getAllNotifications as getAllNotificationsHelper,
  getNotificationsForUser as getNotificationsForUserHelper,
  markNotificationAsRead as markNotificationAsReadHelper,
  markAllNotificationsAsRead as markAllNotificationsAsReadHelper,
  getUnreadCount as getUnreadCountHelper,
  setActiveConnections 
} from "../../utils/notificationHelper.js";
import { WebSocketServer } from "ws";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const activeConnections = new Map();

// Export for use in other controllers
export { activeConnections };

/**
 * Send notification to a specific user (wrapper for helper)
 */
export const sendNotificationToUser = (userId, notification) => {
  const ws = activeConnections.get(userId);
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({
      type: 'notification',
      data: notification
    }));
  }
};

/**
 * Create a new notification (HTTP endpoint)
 */
export const createNotification = asyncHandler(async (req, res) => {
  const { userId, title, message, type = 'info' } = req.body;

  if (!title || !message) {
    return sendResponse(
      res,
      false,
      null,
      "Title and message are required",
      statusType.BAD_REQUEST
    );
  }

  try {
    const result = await createNotificationHelper({
      title,
      message,
      type,
      userIds: userId ? [parseInt(userId)] : [],
      // category
    }, res);

    return sendResponse(
      res,
      true,
      result,
      "Notification created successfully",
      statusType.CREATED
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    return sendResponse(
      res,
      false,
      null,
      "Error creating notification",
      statusType.INTERNAL_SERVER_ERROR
    );
  }
});

/**
 * Get notifications for current user
 */
export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  if (!userId) {
    return sendResponse(res, false, null, "User not authenticated", statusType.UNAUTHORIZED);
  }

  try {
    const result = await getNotificationsForUserHelper(userId, page, limit, unreadOnly === 'true', res);
    
    return sendResponse(
      res,
      true,
      result,
      "Notifications retrieved successfully",
      statusType.OK
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return sendResponse(
      res,
      false,
      null,
      "Error fetching notifications",
      statusType.INTERNAL_SERVER_ERROR
    );
  }
});

/**
 * Get all notifications (admin)
 */
export const getAllNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const result = await getAllNotificationsHelper(page, limit, res);
    
    return sendResponse(
      res,
      true,
      result,
      "All notifications retrieved successfully",
      statusType.OK
    );
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    return sendResponse(
      res,
      false,
      null,
      "Error fetching notifications",
      statusType.INTERNAL_SERVER_ERROR
    );
  }
});

/**
 * Mark notification as read
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(res, false, null, "User not authenticated", statusType.UNAUTHORIZED);
  }

  try {
    await markNotificationAsReadHelper(id, userId, res);
    
    return sendResponse(
      res,
      true,
      null,
      "Notification marked as read",
      statusType.OK
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return sendResponse(
      res,
      false,
      null,
      "Error marking notification as read",
      statusType.INTERNAL_SERVER_ERROR
    );
  }
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(res, false, null, "User not authenticated", statusType.UNAUTHORIZED);
  }

  try {
    await markAllNotificationsAsReadHelper(userId, res);
    
    return sendResponse(
      res,
      true,
      null,
      "All notifications marked as read",
      statusType.OK
    );
  } catch (error) {
    console.error("Error marking all as read:", error);
    return sendResponse(
      res,
      false,
      null,
      "Error marking all as read",
      statusType.INTERNAL_SERVER_ERROR
    );
  }
});

/**
 * Get unread count
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(res, false, null, "User not authenticated", statusType.UNAUTHORIZED);
  }

  try {
    const count = await getUnreadCountHelper(userId, res);
    
    return sendResponse(
      res,
      true,
      { count },
      "Unread count retrieved",
      statusType.OK
    );
  } catch (error) {
    console.error("Error getting unread count:", error);
    return sendResponse(
      res,
      false,
      null,
      "Error getting unread count",
      statusType.INTERNAL_SERVER_ERROR
    );
  }
});

// WebSocket Server Setup
export const setupWebSocketServer = (server) => {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  setActiveConnections(activeConnections);

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      console.log('No token provided for WebSocket connection');
      ws.close(1008, 'No token provided');
      return;
    }

    try {
      // Verify with the same secret
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Support both id and userId in token
      const userId = decoded.id || decoded.userId;
      
      if (!userId) {
        throw new Error('No userId in token');
      }
      
      console.log(`User ${userId} connected to WebSocket`);
      
      activeConnections.set(userId, ws);

      ws.send(JSON.stringify({
        type: 'connected',
        message: 'WebSocket connected successfully',
        userId: userId
      }));

      // ... rest of WebSocket handlers ...

    } catch (error) {
      console.error('JWT verification failed:', error.message);
      ws.close(1008, 'Invalid token');
    }
  });

  console.log('WebSocket server started');
  return wss;
};

export const notificationController = {
  createNotification,
  getUserNotifications,
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  sendNotificationToUser,
  setupWebSocketServer,
  activeConnections
};