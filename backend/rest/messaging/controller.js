import Message from "../../models/Message.js";
import User from "../../models/User.js";
import mongoose from "mongoose";

// Get messages between users or all messages for a user
export const getMessage = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { with_user, limit = 10, page = 1, sort = "desc" } = req.query;

    // Validate user_id
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    let query = {};

    if (with_user) {
      // Get conversation between two users
      if (!mongoose.Types.ObjectId.isValid(with_user)) {
        return res.status(400).json({
          success: false,
          message: "Invalid with_user ID format",
        });
      }

      query = {
        $or: [
          { sender_id: user_id, recipient_id: with_user },
          { sender_id: with_user, recipient_id: user_id },
        ],
      };
    } else {
      // Get all messages for a user
      query = {
        $or: [{ sender_id: user_id }, { recipient_id: user_id }],
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = sort === "asc" ? 1 : -1;

    const messages = await Message.find(query)
      .populate("sender_id", "name email profile_picture status")
      .populate("recipient_id", "name email profile_picture status")
    //   .populate("attachments")
      .sort({ sent_at: sortOrder })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const totalMessages = await Message.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMessages / parseInt(limit)),
          totalMessages,
          hasMore: skip + messages.length < totalMessages,
        },
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { sender_id, recipient_id, content, attachments = [] } = req.body;

    // Validation
    if (!sender_id || !recipient_id) {
      return res.status(400).json({
        success: false,
        message: "Sender ID and Recipient ID are required",
      });
    }

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Message content or attachments are required",
      });
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(sender_id) ||
      !mongoose.Types.ObjectId.isValid(recipient_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Check if users exist
    const [sender, recipient] = await Promise.all([
      User.findById(sender_id).select("name"),
      User.findById(recipient_id).select("name"),
    ]);

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Sender not found",
      });
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
      });
    }

    // Create message
    const message = new Message({
      sender_id,
      recipient_id,
      content: content?.trim() || "",
      attachments,
      sent_at: new Date(),
    });

    await message.save();

    // Populate the saved message before returning
    const populatedMessage = await Message.findById(message._id)
      .populate("sender_id", "name email profile_picture status")
      .populate("recipient_id", "name email profile_picture status")
      .populate("attachments")
      .lean();

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update message read status
export const updateReadMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    const { reader_id } = req.body;

    // Validation
    if (!mongoose.Types.ObjectId.isValid(message_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID format",
      });
    }

    if (!reader_id || !mongoose.Types.ObjectId.isValid(reader_id)) {
      return res.status(400).json({
        success: false,
        message: "Valid reader ID is required",
      });
    }

    // Find the message
    const message = await Message.findById(message_id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if the reader is the recipient
    if (message.recipient_id.toString() !== reader_id) {
      return res.status(403).json({
        success: false,
        message: "You can only mark messages sent to you as read",
      });
    }

    // Update read status
    const updatedMessage = await Message.findByIdAndUpdate(
      message_id,
      {
        is_read: true,
        read_at: new Date(),
      },
      { new: true }
    )
      .populate("sender_id", "name email profile_picture status")
      .populate("recipient_id", "name email profile_picture status")
      .lean();

    res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: updatedMessage,
    });
  } catch (error) {
    console.error("Update read message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Bulk update multiple messages as read
export const markMultipleMessagesAsRead = async (message_ids, reader_id) => {
  try {
    if (!Array.isArray(message_ids) || message_ids.length === 0) {
      throw new Error("Message IDs array is required");
    }

    // Validate all message IDs
    const validIds = message_ids.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validIds.length === 0) {
      throw new Error("No valid message IDs provided");
    }

    // Update multiple messages
    const result = await Message.updateMany(
      {
        _id: { $in: validIds },
        recipient_id: reader_id,
        is_read: false,
      },
      {
        is_read: true,
        read_at: new Date(),
      }
    );

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      message_ids: validIds,
    };
  } catch (error) {
    console.error("Mark multiple messages as read error:", error);
    throw error;
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    const { user_id } = req.body; // User requesting deletion

    // Validation
    if (!mongoose.Types.ObjectId.isValid(message_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID format",
      });
    }

    if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    // Find the message
    const message = await Message.findById(message_id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if user owns the message (only sender can delete)
    if (message.sender_id.toString() !== user_id) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    // Delete the message
    await Message.findByIdAndDelete(message_id);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      data: {
        deleted_message_id: message_id,
        deleted_at: new Date(),
      },
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Helper function to get a single message (for socket operations)
export const getSingleMessage = async (message_id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(message_id)) {
      return null;
    }

    const message = await Message.findById(message_id)
      .populate("sender_id", "name email profile_picture status")
      .populate("recipient_id", "name email profile_picture status")
      .lean();

    return message;
  } catch (error) {
    console.error("Get single message error:", error);
    return null;
  }
};

// Helper function to delete message (for socket operations)
export const deleteSingleMessage = async (message_id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(message_id)) {
      throw new Error("Invalid message ID");
    }

    const result = await Message.findByIdAndDelete(message_id);
    return result;
  } catch (error) {
    console.error("Delete single message error:", error);
    throw error;
  }
};
