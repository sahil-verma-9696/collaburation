import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["friend_request", "message", "friend_accepted"],
      required: true,
    },
    related_id: {
      type: mongoose.Schema.Types.ObjectId, // can store FriendRequest ID or Message ID
      required: true,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    read_at: {
      type: Date,
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    // Optional metadata for richer notifications
    metadata: {
      sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
      sender_name: {
        type: String,
        required: false,
      },
      message_preview: {
        type: String,
        required: false,
        maxLength: 200,
      },
      created_at: {
        type: Date,
        required: false,
      },
    },
  },
  {
    timestamps: false, // created_at is enough here
  }
);

// Index for better query performance
notificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });
notificationSchema.index({ user_id: 1, type: 1, related_id: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
