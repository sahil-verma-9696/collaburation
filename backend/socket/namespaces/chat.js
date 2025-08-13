import Message from "../../models/Message.js";
import Friendship from "../../models/Friendship.js";
import User from "../../models/User.js";
import chalk from "chalk";

export function chatNamespaceHandler() {
  return (socket) => {

    // Join user to their personal room for direct messaging
    socket.join(`user_${socket.userId}`);

    // Handle sending messages
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

        // Send to recipient
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

    // Handle marking messages as read
    socket.on("read", async (data) => {
      try {
        const updatedMessages = await markMessagesAsRead(
          data.message_ids,
          socket.userId
        );

        // Notify senders that their messages were read
        for (const messageId of data.message_ids) {
          const message = await getMessage(messageId);
          console.log(message)
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

    // Handle getting online users (when user connects)
    socket.on("join_chat", async () => {
      try {
        // Get all online user IDs except current user
        const onlineUserIds = Array.from(socket.idToSocketMap.keys()).filter(
          (userId) => userId !== socket.userId
        );

        // Get user details for online users
        const onlineUsers = await User.find({
          _id: { $in: onlineUserIds },
        }).select("name email avatar status");

        socket.emit("get_online_users", onlineUserIds);

        // Notify others that this user is online
        socket.broadcast.emit("user_online", {
          user_id: socket.userId,
          user_name: socket.user.name,
          user_avatar: socket.user.avatar || null,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Get online users error:", error);
        socket.emit("error", {
          event: "get_online_users",
          message: "Failed to get online users",
        });
      }
    });

    socket.on("leave_chat", () => {
      // Get all online user IDs except current user
      const onlineUserIds = Array.from(socket.idToSocketMap.keys()).filter(
        (userId) => userId !== socket.userId
      );

      socket.emit("get_online_users", onlineUserIds);
      // Notify others that this user is offline
      socket.broadcast.emit("user_offline", {
        user_id: socket.userId,
        timestamp: new Date(),
      });
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
