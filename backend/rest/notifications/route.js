import express from "express";
import { createBulkNotifications, createNotification, deleteAllNotifications, deleteNotification, getNotificationsByType, getUnreadCount, getUserNotifications, markAllAsRead, markAsRead } from "./controllers.js";


const router = express.Router();


router.get("/user/:user_id", getUserNotifications);
router.put("/user/:user_id/read-all", markAllAsRead);
router.delete("/user/:user_id", deleteAllNotifications);
router.get("/user/:user_id/unread-count", getUnreadCount);
router.get("/user/:user_id/type/:type", getNotificationsByType);

router.post("/", createNotification);
router.post("/bulk", createBulkNotifications);
router.put("/:notification_id/read", markAsRead);
router.delete("/:notification_id", deleteNotification);

export default router;
