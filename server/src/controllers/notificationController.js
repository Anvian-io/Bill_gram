import { getPrismaOrFail, sendResponse, asyncHandler, statusType } from "../utils/index.js";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import jwt from 'jsonwebtoken';

// Add JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// Store active WebSocket connections
const activeConnections = new Map(); // userId -> WebSocket

/**
 * Send notification to a specific user
 */
export const sendNotificationToUser = (userId, notification) => {
  const ws = activeConnections.get(userId);
  if (ws && ws.readyState === 1) { // 1 = OPEN
    ws.send(JSON.stringify({
      type: 'notification',
      data: notification
    }));
  }
};

/**
 * Create a new notification
 */
export const createNotification = asyncHandler(async (req, res) => {
  const { userId, title, message, type = 'info' } = req.body;

  if (!userId || !title || !message) {
    return sendResponse(
      res,
      statusType.BAD_REQUEST,
      null,
      "UserId, title and message are required"
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  try {
    const notification = await prisma.notification.create({
      data: {
        userId: parseInt(userId),
        title,
        message,
        type,
        read: false
      }
    });

    // Send real-time notification
    sendNotificationToUser(parseInt(userId), notification);

    return sendResponse(
      res,
      statusType.CREATED,
      { notification },
      "Notification created successfully"
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    return sendResponse(
      res,
      statusType.INTERNAL_SERVER_ERROR,
      null,
      "Error creating notification"
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
    return sendResponse(res, statusType.UNAUTHORIZED, null, "User not authenticated");
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  try {
    const where = {
      userId: parseInt(userId),
      ...(unreadOnly === 'true' && { read: false })
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where })
    ]);

    return sendResponse(
      res,
      statusType.OK,
      {
        data: {
          notifications,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
          }
        }
      },
      "Notifications retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return sendResponse(
      res,
      statusType.INTERNAL_SERVER_ERROR,
      null,
      "Error fetching notifications"
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
    return sendResponse(res, statusType.UNAUTHORIZED, null, "User not authenticated");
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  try {
    const notification = await prisma.notification.update({
      where: {
        id: parseInt(id),
        userId: parseInt(userId)
      },
      data: { read: true }
    });

    return sendResponse(
      res,
      statusType.OK,
      { notification },
      "Notification marked as read"
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return sendResponse(
      res,
      statusType.INTERNAL_SERVER_ERROR,
      null,
      "Error marking notification as read"
    );
  }
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(res, statusType.UNAUTHORIZED, null, "User not authenticated");
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  try {
    await prisma.notification.updateMany({
      where: {
        userId: parseInt(userId),
        read: false
      },
      data: { read: true }
    });

    return sendResponse(
      res,
      statusType.OK,
      { message: "All notifications marked as read" },
      "All notifications marked as read"
    );
  } catch (error) {
    console.error("Error marking all as read:", error);
    return sendResponse(
      res,
      statusType.INTERNAL_SERVER_ERROR,
      null,
      "Error marking all as read"
    );
  }
});

/**
 * Get unread count
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(res, statusType.UNAUTHORIZED, null, "User not authenticated");
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  try {
    const count = await prisma.notification.count({
      where: {
        userId: parseInt(userId),
        read: false
      }
    });

    return sendResponse(
      res,
      statusType.OK,
      {
        data: { count }
      },
      "Unread count retrieved"
    );
  } catch (error) {
    console.error("Error getting unread count:", error);
    return sendResponse(
      res,
      statusType.INTERNAL_SERVER_ERROR,
      null,
      "Error getting unread count"
    );
  }
});


// WebSocket Server Setup
export const setupWebSocketServer = (server) => {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    
    // Extract token from query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      console.log('No token provided for WebSocket connection');
      ws.close(1008, 'No token provided');
      return;
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.userId;
      
      console.log(`User ${userId} connected to WebSocket`);
      
      // Store connection
      activeConnections.set(userId, ws);

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'WebSocket connected successfully'
      }));

      // Handle messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('Received WebSocket message:', data);
          
          // Handle different message types
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        activeConnections.delete(userId);
        console.log(`User ${userId} disconnected from WebSocket`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        activeConnections.delete(userId);
      });

    } catch (error) {
      console.error('JWT verification failed:', error.message);
      ws.close(1008, 'Invalid token');
      return;
    }
  });

  console.log('WebSocket server started');
  return wss;
};

export const notificationController = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  sendNotificationToUser,
  setupWebSocketServer
};