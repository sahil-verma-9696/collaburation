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
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // created_at is enough here
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
