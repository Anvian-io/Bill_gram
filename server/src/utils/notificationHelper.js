import Notification from "../models/Notification.js";
import userNotification from "../models/userNotification.js";
import user from "../models/user.js";

// Create a new notification
export const createNotification = async ({ title, message, type }) => {
    try {
        const notification = await Notification.create({
            title,
            message,
            type,
            read: false
        });
        console.log(notification, "fowehfio");
        await createNotificationForUsers(notification._id);

        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
};

// Get all system notifications
export const getallNotifications = async (page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;

        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments();

        return {
            notifications,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Error fetching notifications:", error);
        throw error;
    }
};

// Create notification for users
export const createNotificationForUsers = async (notification_Id) => {
    try {
        const userIds = await user.find({}).select("_id");
        // console.log(userIds)

        // const notification = await Notification.create({
        //     title,
        //     message,
        //     type,
        //     category,
        //     read: false
        // });
        console.log(notification_Id);

        const userNotifications = userIds.map((userDoc) => ({
            user: userDoc._id,
            notification: notification_Id,
            read: false
        }));

        await userNotification.insertMany(userNotifications);

        return userNotifications;
    } catch (error) {
        console.error("Error creating notification for users:", error);
        throw error;
    }
};

// Get notifications for a specific user with pagination
export const getUserNotifications = async (user_id, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;

        const notifications = await userNotification
            .find({ user: user_id ,read:false})
            .populate("notification")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await userNotification.countDocuments({ user: user_id ,read:false});

        return {
            notifications: notifications.map((notif) => ({
                _id: notif._id,
                read: notif.read,
                createdAt: notif.createdAt,
                notification: notif.notification
            })),
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Error fetching user notifications:", error);
        throw error;
    }
};

// Update user notification - mark as read
export const updateUserNotification = async (user_id, notificationId = null) => {
    try {
        // if (notificationId) {
            // Mark specific notification as read
            await userNotification.updateMany({ user: user_id }, { read: true });
        // } else {
        //     // Mark all user notifications as read
        //     await userNotification.updateMany({ user: user_id, read: false }, { read: true });
        // }
    } catch (error) {
        console.error("Error updating user notification:", error);
        throw error;
    }
};
