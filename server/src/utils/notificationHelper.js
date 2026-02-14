import { getPrismaOrFail } from "./index.js";

// Store active WebSocket connections (shared with notificationController)
let activeConnections = new Map();

/**
 * Set the active connections map (called from notificationController setup)
 */
export const setActiveConnections = (connectionsMap) => {
  activeConnections = connectionsMap;
};

/**
 * Send real-time notification to specific users via WebSocket
 */
export const sendNotificationToUsers = (userIds, notification) => {
  if (!Array.isArray(userIds)) {
    userIds = [userIds];
  }

  userIds.forEach((userId) => {
    const ws = activeConnections.get(parseInt(userId));
    if (ws && ws.readyState === 1) {
      // 1 = OPEN
      ws.send(
        JSON.stringify({
          type: "notification",
          data: notification,
        }),
      );
    }
  });
};

/**
 * Send notification to all connected users
 */
export const sendNotificationToAll = (notification) => {
  activeConnections.forEach((ws, userId) => {
    if (ws.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: "notification",
          data: notification,
        }),
      );
    }
  });
};

/**
 * Create notification for specific users or all users
 * @param {Object} params - Notification parameters
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} params.type - Notification type (info, success, warning, error)
 * @param {Array<number>} params.userIds - Array of user IDs (empty = all users)
 
 * @param {Object} res - Express response object (optional, for Prisma init)
 */
export const createNotification = async (
  { title, message, type = "info", userIds = [] },
  res = null,
) => {
  try {
    // Get Prisma instance
    let prisma;
    if (res) {
      prisma = getPrismaOrFail(res);
      if (!prisma) throw new Error("Prisma initialization failed");
    } else {
      const { prisma: prismaInstance } = await import("../db/database.js");
      prisma = prismaInstance;
    }

    // If no specific users provided, get all active users
    let targetUserIds = userIds;
    if (!targetUserIds || targetUserIds.length === 0) {
      const allUsers = await prisma.user.findMany({
        select: { id: true }, // Removed where: { deleted: false }
      });
      targetUserIds = allUsers.map((u) => u.id);
    }

    // Create notifications for each user
    const notifications = [];
    for (const userId of targetUserIds) {
      const notification = await prisma.notification.create({
        data: {
          userId: parseInt(userId),
          title,
          message,
          type,
        //   category,
          read: false,
        },
      });
      notifications.push(notification);
    }

    // Send real-time notifications via WebSocket
    sendNotificationToUsers(targetUserIds, {
      id: notifications[0]?.id,
      title,
      message,
      type,
    //   category,
      read: false,
      createdAt: new Date().toISOString(),
    });

    console.log(
      `✓ Notification sent to ${targetUserIds.length} users: ${title}`,
    );

    return {
      success: true,
      notifications,
      recipientCount: targetUserIds.length,
    };
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Create notification for all users (broadcast)
 */
export const createNotificationForAll = async (
  { title, message, type = "info" },
  res = null,
) => {
  return createNotification(
    { title, message, type, userIds: [] },
    res,
  );
};

/**
 * Get all system notifications (admin view)
 */
export const getAllNotifications = async (page = 1, limit = 10, res = null) => {
  try {
    let prisma;
    if (res) {
      prisma = getPrismaOrFail(res);
      if (!prisma) throw new Error("Prisma initialization failed");
    } else {
      const { prisma: prismaInstance } = await import("../db/database.js");
      prisma = prismaInstance;
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
        },
      }),
      prisma.notification.count(),
    ]);

    return {
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    throw error;
  }
};

/**
 * Get notifications for specific user
 */
export const getNotificationsForUser = async (
  userId,
  page = 1,
  limit = 10,
  unreadOnly = false,
  res = null,
) => {
  try {
    let prisma;
    if (res) {
      prisma = getPrismaOrFail(res);
      if (!prisma) throw new Error("Prisma initialization failed");
    } else {
      const { prisma: prismaInstance } = await import("../db/database.js");
      prisma = prismaInstance;
    }

    const skip = (page - 1) * limit;

    const where = {
      userId: parseInt(userId),
      ...(unreadOnly && { read: false }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  notificationId,
  userId,
  res = null,
) => {
  try {
    let prisma;
    if (res) {
      prisma = getPrismaOrFail(res);
      if (!prisma) throw new Error("Prisma initialization failed");
    } else {
      const { prisma: prismaInstance } = await import("../db/database.js");
      prisma = prismaInstance;
    }

    const notification = await prisma.notification.updateMany({
      where: {
        id: parseInt(notificationId),
        userId: parseInt(userId),
      },
      data: { read: true },
    });

    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read for user
 */
export const markAllNotificationsAsRead = async (userId, res = null) => {
  try {
    let prisma;
    if (res) {
      prisma = getPrismaOrFail(res);
      if (!prisma) throw new Error("Prisma initialization failed");
    } else {
      const { prisma: prismaInstance } = await import("../db/database.js");
      prisma = prismaInstance;
    }

    await prisma.notification.updateMany({
      where: {
        userId: parseInt(userId),
        read: false,
      },
      data: { read: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

/**
 * Get unread notification count for user
 */
export const getUnreadCount = async (userId, res = null) => {
  try {
    let prisma;
    if (res) {
      prisma = getPrismaOrFail(res);
      if (!prisma) throw new Error("Prisma initialization failed");
    } else {
      const { prisma: prismaInstance } = await import("../db/database.js");
      prisma = prismaInstance;
    }

    const count = await prisma.notification.count({
      where: {
        userId: parseInt(userId),
        read: false,
      },
    });

    return count;
  } catch (error) {
    console.error("Error getting unread count:", error);
    throw error;
  }
};

export default {
  createNotification,
  createNotificationForAll,
  getAllNotifications,
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  sendNotificationToUsers,
  sendNotificationToAll,
  setActiveConnections,
};
