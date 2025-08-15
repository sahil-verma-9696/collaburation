import Notification from "../../models/Notification.js";
import mongoose from "mongoose";

// Get all notifications for a user
export const getUserNotifications = async (req, res) => {
  const { user_id } = req.params;
  const { page = 1, limit = 20, is_read } = req.query;

  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    const err = new Error("Invalid user ID format");
    err.statusCode = 400;
    throw err;
  }

  const filter = { user_id };
  if (is_read !== undefined) {
    filter.is_read = is_read === "true";
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const notifications = await Notification.find(filter)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate("related_id")
    .lean();

  const total = await Notification.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      notifications,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit),
      },
    },
  });
};

// Create a new notification
export const createNotification = async (req, res) => {
  const { user_id, type, related_id } = req.body;

  if (!user_id || !type || !related_id) {
    const err = new Error("user_id, type, and related_id are required");
    err.statusCode = 400;
    throw err;
  }

  if (
    !mongoose.Types.ObjectId.isValid(user_id) ||
    !mongoose.Types.ObjectId.isValid(related_id)
  ) {
    const err = new Error("Invalid ObjectId format");
    err.statusCode = 400;
    throw err;
  }

  const validTypes = ["friend_request", "message", "friend_accepted"];
  if (!validTypes.includes(type)) {
    const err = new Error("Invalid notification type");
    err.statusCode = 400;
    throw err;
  }

  const notification = new Notification({ user_id, type, related_id });
  const savedNotification = await notification.save();

  res.status(201).json({
    success: true,
    message: "Notification created successfully",
    data: savedNotification,
  });
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  const { notification_id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(notification_id)) {
    const err = new Error("Invalid notification ID format");
    err.statusCode = 400;
    throw err;
  }

  const notification = await Notification.findByIdAndUpdate(
    notification_id,
    { is_read: true },
    { new: true }
  );

  if (!notification) {
    const err = new Error("Notification not found");
    err.statusCode = 404;
    throw err;
  }

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    data: notification,
  });
};

// Mark all notifications as read for a user
export const markAllAsRead = async (req, res) => {
  const { user_id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    const err = new Error("Invalid user ID format");
    err.statusCode = 400;
    throw err;
  }

  const result = await Notification.updateMany(
    { user_id, is_read: false },
    { is_read: true }
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} notifications marked as read`,
    data: { modified_count: result.modifiedCount },
  });
};

// Get unread notification count for a user
export const getUnreadCount = async (req, res) => {
  const { user_id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    const err = new Error("Invalid user ID format");
    err.statusCode = 400;
    throw err;
  }

  const count = await Notification.countDocuments({
    user_id,
    is_read: false,
  });

  res.status(200).json({
    success: true,
    data: { unread_count: count },
  });
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  const { notification_id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(notification_id)) {
    const err = new Error("Invalid notification ID format");
    err.statusCode = 400;
    throw err;
  }

  const notification = await Notification.findByIdAndDelete(notification_id);

  if (!notification) {
    const err = new Error("Notification not found");
    err.statusCode = 404;
    throw err;
  }

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
  });
};

// Delete all notifications for a user
export const deleteAllNotifications = async (req, res) => {
  const { user_id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    const err = new Error("Invalid user ID format");
    err.statusCode = 400;
    throw err;
  }

  const result = await Notification.deleteMany({ user_id });

  res.status(200).json({
    success: true,
    message: `${result.deletedCount} notifications deleted`,
    data: { deleted_count: result.deletedCount },
  });
};

// Get notifications by type for a user
export const getNotificationsByType = async (req, res) => {
  const { user_id, type } = req.params;
  const { page = 1, limit = 20 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    const err = new Error("Invalid user ID format");
    err.statusCode = 400;
    throw err;
  }

  const validTypes = ["friend_request", "message", "friend_accepted"];
  if (!validTypes.includes(type)) {
    const err = new Error("Invalid notification type");
    err.statusCode = 400;
    throw err;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const notifications = await Notification.find({ user_id, type })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate("related_id")
    .lean();

  const total = await Notification.countDocuments({ user_id, type });

  res.status(200).json({
    success: true,
    data: {
      notifications,
      type,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit),
      },
    },
  });
};

// Bulk create notifications
export const createBulkNotifications = async (req, res) => {
  const { notifications } = req.body;

  if (!Array.isArray(notifications) || notifications.length === 0) {
    const err = new Error(
      "notifications array is required and should not be empty"
    );
    err.statusCode = 400;
    throw err;
  }

  const validTypes = ["friend_request", "message", "friend_accepted"];
  for (const notif of notifications) {
    if (!notif.user_id || !notif.type || !notif.related_id) {
      const err = new Error(
        "Each notification must have user_id, type, and related_id"
      );
      err.statusCode = 400;
      throw err;
    }

    if (
      !mongoose.Types.ObjectId.isValid(notif.user_id) ||
      !mongoose.Types.ObjectId.isValid(notif.related_id)
    ) {
      const err = new Error("Invalid ObjectId format in notifications");
      err.statusCode = 400;
      throw err;
    }

    if (!validTypes.includes(notif.type)) {
      const err = new Error(`Invalid notification type: ${notif.type}`);
      err.statusCode = 400;
      throw err;
    }
  }

  const createdNotifications = await Notification.insertMany(notifications);

  res.status(201).json({
    success: true,
    message: `${createdNotifications.length} notifications created successfully`,
    data: {
      created_count: createdNotifications.length,
      notifications: createdNotifications,
    },
  });
};
