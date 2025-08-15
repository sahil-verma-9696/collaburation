import Message from "../../models/Message.js";
import Friendship from "../../models/Friendship.js";
import Notification from "../../models/Notification.js";
import User from "../../models/User.js";
import chalk from "chalk";

export function chatNamespaceHandler(namespace) {
  return (socket) => {
    // Join user to their personal room for direct messaging
    socket.join(`user_${socket.userId}`);

    // Handle getting online users (when user connects)
    socket.on("join_chat", async (data) => {
      try {
        socket.onlineUsersIds.add(socket.userId);
        socket.idToStatusMap.set(socket.userId, {
          status: "online",
          lastSeen: new Date().toString(),
          for: data.friendId,
        });
        console.log(
          chalk.magenta("[JOIN CHAT] "),
          chalk.cyanBright(`[ONLINE USERS]`),
          socket.onlineUsersIds
        );

        namespace.emit(
          "get_online_users",
          Object.fromEntries(socket.idToStatusMap)
        );

        // Notify others that this user is online
        socket.broadcast.emit("online_user", {
          user_id: socket.userId,
          user_name: socket.user.name,
          user_avatar: socket.user.avatar || null,
          timestamp: new Date(),
          status: "online",
        });
      } catch (error) {
        console.error("Get online users error:", error);
        socket.emit("error", {
          event: "online_user",
          message: "Failed to get online users",
        });
      }
    });

    socket.on("leave_chat", async (data) => {
      socket.onlineUsersIds.delete(socket.userId);
      socket.idToStatusMap.set(socket.userId, {
        status: "active",
        lastSeen: new Date().toString(),
      });
      console.log(
        chalk.magenta("[LEAVE CHAT] "),
        chalk.cyanBright(`[ONLINE USERS]`),
        socket.onlineUsersIds
      );
      namespace.emit(
        "get_online_users",
        Object.fromEntries(socket.idToStatusMap)
      );
      // Notify others that this user is offline
      socket.broadcast.emit("online_user", {
        user_id: socket.userId,
        timestamp: new Date(),
        status: "offline",
      });
    });

    // Handle sending messages ✅
    socket.on("message", async (data) => {
      try {
        // Save message to database
        const message = await saveMessage({
          sender_id: socket.userId,
          recipient_id: data.recipient_id,
          content: data.content,
          attachments: data.attachments || [],
        });

        // Populate sender info for message
        const populatedMessage = await Message.findById(message._id).populate(
          "sender_id",
          "name email"
        );

        // Prepare message for recipient
        const messageForRecipient = {
          _id: populatedMessage._id,
          sender_id: populatedMessage.sender_id._id,
          sender_name: populatedMessage.sender_id.name,
          sender_avatar: socket.user.avatar || null,
          recipient_id: populatedMessage.recipient_id,
          content: populatedMessage.content,
          attachments: populatedMessage.attachments,
          is_read: populatedMessage.is_read,
          sent_at: populatedMessage.sent_at,
          is_own_message: false,
        };

        // Check if recipient is online
        const recipientStatus = socket.idToStatusMap.get(data.recipient_id);
        const isRecipientOnline =
          recipientStatus && recipientStatus.status === "online";

        if (!isRecipientOnline) {
          // Recipient is not online - create notification
          console.log(
            chalk.yellow(
              `[OFFLINE RECIPIENT] Creating notification for user: ${data.recipient_id}`
            )
          );

          try {
            await createMessageNotification({
              recipientId: data.recipient_id,
              senderId: socket.userId,
              messageId: populatedMessage._id,
              senderName: socket.user.name,
              messageContent: populatedMessage.content,
            });
            console.log(
              chalk.green(
                `[NOTIFICATION CREATED] For message to offline user: ${data.recipient_id}`
              )
            );
          } catch (notificationError) {
            console.error(chalk.red("[NOTIFICATION ERROR]"), notificationError);
          }
          const notifications = await getUnreadNotifications(data.recipient_id);
          
          // TODO : send Notification
          socket.to(`user_${data.recipient_id}`).emit("new_notification", {
            count: notifications.length,
          });
        }

        // Send to recipient (if online)
        socket
          .to(`user_${data.recipient_id}`)
          .emit("message", messageForRecipient);

        // Send confirmation back to sender
        socket.emit("message", {
          _id: populatedMessage._id,
          sender_id: populatedMessage.sender_id._id,
          sender_name: populatedMessage.sender_id.name,
          sender_avatar: socket.user.avatar || null,
          recipient_id: populatedMessage.recipient_id,
          content: populatedMessage.content,
          attachments: populatedMessage.attachments,
          is_read: populatedMessage.is_read,
          sent_at: populatedMessage.sent_at,
          is_own_message: true,
          temp_id: data.temp_id, // for client-side message matching
        });
      } catch (error) {
        console.error("Message send error:", error);
        socket.emit("error", {
          event: "message",
          message: "Failed to send message",
          temp_id: data.temp_id,
        });
      }
    });

    // Handle marking messages as read ✅
    socket.on("read", async (data) => {
      try {
        const updatedMessages = await markMessagesAsRead(
          data.message_ids,
          socket.userId
        );

        // Mark related notifications as read
        await markMessageNotificationsAsRead(data.message_ids, socket.userId);

        // Notify senders that their messages were read
        for (const messageId of data.message_ids) {
          const message = await getMessage(messageId);
          console.log(message);
          if (message && message.sender_id.toString() !== socket.userId) {
            socket.to(`user_${message.sender_id}`).emit("read", {
              message_id: messageId,
              read_by: socket.userId,
              read_by_name: socket.user.name,
              read_at: new Date(),
            });
          }
        }

        // Confirm to sender
        socket.emit("read", {
          message_ids: data.message_ids,
          confirmed: true,
        });
      } catch (error) {
        console.error("Mark read error:", error);
        socket.emit("error", {
          event: "read",
          message: "Failed to mark messages as read",
        });
      }
    });

    // Handle typing indicators ✅
    socket.on("typing", (data) => {
      // Validate recipient
      if (!data.recipient_id) return;

      const typingData = {
        user_id: socket.userId,
        user_name: socket.user.name,
        status: data.status, // "start" or "stop"
        timestamp: new Date(),
      };

      // Send typing indicator to recipient
      socket.to(`user_${data.recipient_id}`).emit("typing", typingData);
    });

    // Handle message deletion
    socket.on("delete", async (data) => {
      try {
        const message = await getMessage(data.message_id);

        // Check if user owns the message
        if (!message || message.sender_id.toString() !== socket.userId) {
          socket.emit("error", {
            event: "delete",
            message: "Cannot delete this message",
          });
          return;
        }

        await deleteMessage(data.message_id);

        // Delete related notifications
        await deleteMessageNotifications(data.message_id);

        const deleteData = {
          message_id: data.message_id,
          deleted_by: socket.userId,
          deleted_at: new Date(),
        };

        // Notify recipient
        socket.to(`user_${message.recipient_id}`).emit("delete", deleteData);

        // Confirm to sender
        socket.emit("delete", {
          ...deleteData,
          confirmed: true,
        });
      } catch (error) {
        console.error("Delete message error:", error);
        socket.emit("error", {
          event: "delete",
          message: "Failed to delete message",
        });
      }
    });

    // Handle getting unread notifications
    socket.on("get_notifications", async () => {
      try {
        const notifications = await getUnreadNotifications(socket.userId);
        socket.emit("notifications", {
          notifications,
          count: notifications.length,
        });
      } catch (error) {
        console.error("Get notifications error:", error);
        socket.emit("error", {
          event: "get_notifications",
          message: "Failed to get notifications",
        });
      }
    });

    // Handle marking notifications as read
    socket.on("mark_notifications_read", async (data) => {
      try {
        await markNotificationsAsRead(
          data.notification_ids || [],
          socket.userId
        );
        socket.emit("notifications_marked_read", {
          notification_ids: data.notification_ids,
          confirmed: true,
        });
      } catch (error) {
        console.error("Mark notifications read error:", error);
        socket.emit("error", {
          event: "mark_notifications_read",
          message: "Failed to mark notifications as read",
        });
      }
    });
  };
}

// Helper functions implementation

async function saveMessage(messageData) {
  try {
    const message = new Message({
      sender_id: messageData.sender_id,
      recipient_id: messageData.recipient_id,
      content: messageData.content,
      attachments: messageData.attachments,
      sent_at: new Date(),
      is_read: false,
    });

    const savedMessage = await message.save();
    return savedMessage.toObject();
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
}

async function getMessage(messageId) {
  try {
    const message = await Message.findById(messageId);
    return message;
  } catch (error) {
    console.error("Error getting message:", error);
    throw error;
  }
}

async function markMessagesAsRead(messageIds, userId) {
  try {
    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        recipient_id: userId,
        is_read: false,
      },
      {
        is_read: true,
        read_at: new Date(),
      }
    );

    return result;
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
}

async function deleteMessage(messageId) {
  try {
    const result = await Message.findByIdAndDelete(messageId);
    return result;
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
}

// Notification helper functions

async function createMessageNotification({
  recipientId,
  senderId,
  messageId,
  senderName,
  messageContent,
}) {
  try {
    // Check if there's already a notification for this message
    const existingNotification = await Notification.findOne({
      user_id: recipientId,
      type: "message",
      related_id: messageId,
    });

    if (existingNotification) {
      console.log(`Notification already exists for message: ${messageId}`);
      return existingNotification;
    }

    const notification = new Notification({
      user_id: recipientId,
      type: "message",
      related_id: messageId,
      is_read: false,
      created_at: new Date(),
      // Optional: Add metadata for rich notifications
      metadata: {
        sender_id: senderId,
        sender_name: senderName,
        message_preview: messageContent.substring(0, 100), // First 100 characters
        created_at: new Date(),
      },
    });

    const savedNotification = await notification.save();
    console.log(
      chalk.green(`[NOTIFICATION SAVED] ID: ${savedNotification._id}`)
    );
    return savedNotification;
  } catch (error) {
    console.error("Error creating message notification:", error);
    throw error;
  }
}

async function getUnreadNotifications(userId) {
  try {
    const notifications = await Notification.find({
      user_id: userId,
      is_read: false,
    })
      .populate("related_id") // Populate the message
      .sort({ created_at: -1 })
      .limit(50); // Limit to recent 50 notifications

    return notifications;
  } catch (error) {
    console.error("Error getting unread notifications:", error);
    throw error;
  }
}

async function markMessageNotificationsAsRead(messageIds, userId) {
  try {
    const result = await Notification.updateMany(
      {
        user_id: userId,
        type: "message",
        related_id: { $in: messageIds },
        is_read: false,
      },
      {
        is_read: true,
        read_at: new Date(),
      }
    );

    console.log(
      chalk.blue(`[NOTIFICATIONS MARKED READ] Count: ${result.modifiedCount}`)
    );
    return result;
  } catch (error) {
    console.error("Error marking message notifications as read:", error);
    throw error;
  }
}

async function markNotificationsAsRead(notificationIds, userId) {
  try {
    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        user_id: userId,
        is_read: false,
      },
      {
        is_read: true,
        read_at: new Date(),
      }
    );

    return result;
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
}

async function deleteMessageNotifications(messageId) {
  try {
    const result = await Notification.deleteMany({
      type: "message",
      related_id: messageId,
    });

    console.log(
      chalk.yellow(
        `[NOTIFICATIONS DELETED] Count: ${result.deletedCount} for message: ${messageId}`
      )
    );
    return result;
  } catch (error) {
    console.error("Error deleting message notifications:", error);
    throw error;
  }
}

// Existing helper functions (unchanged)

async function getUserFriends(userId) {
  try {
    // Get accepted friendships where user is either requester or recipient
    const friendships = await Friendship.find({
      $or: [
        { requester_id: userId, status: "accepted" },
        { recipient_id: userId, status: "accepted" },
      ],
    }).populate("requester_id recipient_id", "name email avatar");

    // Extract friend user objects
    const friends = friendships.map((friendship) => {
      if (friendship.requester_id._id.toString() === userId) {
        return {
          id: friendship.recipient_id._id,
          name: friendship.recipient_id.name,
          email: friendship.recipient_id.email,
          avatar: friendship.recipient_id.avatar,
        };
      } else {
        return {
          id: friendship.requester_id._id,
          name: friendship.requester_id.name,
          email: friendship.requester_id.email,
          avatar: friendship.requester_id.avatar,
        };
      }
    });

    return friends;
  } catch (error) {
    console.error("Error getting user friends:", error);
    throw error;
  }
}

async function areFriends(userId1, userId2) {
  try {
    const friendship = await Friendship.findOne({
      $or: [
        { requester_id: userId1, recipient_id: userId2, status: "accepted" },
        { requester_id: userId2, recipient_id: userId1, status: "accepted" },
      ],
    });

    return !!friendship;
  } catch (error) {
    console.error("Error checking friendship:", error);
    return false;
  }
}

async function validateRecipient(senderId, recipientId) {
  try {
    // Check if recipient user exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return false;
    }

    // For now, return true (no friend validation as requested)
    return true;

    // Uncomment below if you want friend validation later:
    // return await areFriends(senderId, recipientId);
  } catch (error) {
    console.error("Error validating recipient:", error);
    return false;
  }
}
