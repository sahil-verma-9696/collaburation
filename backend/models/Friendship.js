import mongoose from "mongoose";

const friendshipSchema = new mongoose.Schema(
  {
    requester_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "blocked"],
      default: "pending",
      required: true,
    },
    requested_at: {
      type: Date,
      default: Date.now,
    },
    responded_at: {
      type: Date,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

// Optional: prevent duplicate friendship entries
friendshipSchema.index(
  { requester_id: 1, recipient_id: 1 },
  { unique: true }
);

const Friendship = mongoose.model("Friendship", friendshipSchema);

export default Friendship;
