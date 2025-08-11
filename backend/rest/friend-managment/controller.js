import {asyncHandler} from "../../utils/async-handler.js";
import Friendship from "../../models/Friendship.js";
import User from "../../models/User.js";

/**
 * @desc    Send a friend request
 * @route   POST /api/friendships/request
 * @access  Private
 */
export const createFriendship = asyncHandler(async (req, res) => {
  const { recipient_id } = req.body;

  if (!recipient_id) {
    res.status(400);
    throw new Error("Recipient ID is required");
  }

  if (recipient_id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot send a friend request to yourself");
  }

  // Check if recipient exists
  const recipient = await User.findById(recipient_id);
  if (!recipient) {
    res.status(404);
    throw new Error("Recipient not found");
  }

  // Prevent duplicate friendship
  const existing = await Friendship.findOne({
    requester_id: req.user._id,
    recipient_id,
  });
  if (existing) {
    res.status(400);
    throw new Error("Friend request already sent");
  }

  const friendship = await Friendship.create({
    requester_id: req.user._id,
    recipient_id,
  });

  res.status(201).json(friendship);
});

/**
 * @desc    Accept a friend request
 * @route   PUT /api/friendships/:friendship_id/accept
 * @access  Private
 */
export const acceptFriendship = asyncHandler(async (req, res) => {
  const { friendship_id } = req.params;

  const friendship = await Friendship.findById(friendship_id);
  if (!friendship) {
    res.status(404);
    throw new Error("Friendship not found");
  }

  if (friendship.recipient_id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only accept requests sent to you");
  }

  friendship.status = "accepted";
  friendship.responded_at = Date.now();
  await friendship.save();

  res.json(friendship);
});

/**
 * @desc    Reject a friend request
 * @route   PUT /api/friendships/:friendship_id/reject
 * @access  Private
 */
export const rejectFriendship = asyncHandler(async (req, res) => {
  const { friendship_id } = req.params;

  const friendship = await Friendship.findById(friendship_id);
  if (!friendship) {
    res.status(404);
    throw new Error("Friendship not found");
  }

  if (friendship.recipient_id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only reject requests sent to you");
  }

  friendship.status = "rejected";
  friendship.responded_at = Date.now();
  await friendship.save();

  res.json(friendship);
});

/**
 * @desc    Delete a friendship (unfriend)
 * @route   DELETE /api/friendships/:friendship_id
 * @access  Private
 */
export const deleteFriendship = asyncHandler(async (req, res) => {
  const { friendship_id } = req.params;

  const friendship = await Friendship.findById(friendship_id);
  if (!friendship) {
    res.status(404);
    throw new Error("Friendship not found");
  }

  if (
    friendship.requester_id.toString() !== req.user._id.toString() &&
    friendship.recipient_id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("You can only delete your own friendships");
  }

  await friendship.deleteOne();

  res.json({ message: "Friendship deleted" });
});

/**
 * @desc    Get all friendships of the user
 * @route   GET /api/friendships
 * @access  Private
 */
export const getFriendships = asyncHandler(async (req, res) => {
  const friendships = await Friendship.find({
    $or: [
      { requester_id: req.user._id, status: "accepted" },
      { recipient_id: req.user._id, status: "accepted" },
    ],
  })
    .populate("requester_id", "name email profile_picture status")
    .populate("recipient_id", "name email profile_picture status");

  res.json(friendships);
});

/**
 * @desc    Get sent friendship requests
 * @route   GET /api/friendships/requests/sent
 * @access  Private
 */
export const getFriendshipRequests = asyncHandler(async (req, res) => {
  const sentRequests = await Friendship.find({
    requester_id: req.user._id,
    status: "pending",
  }).populate("recipient_id", "name email profile_picture");

  res.json(sentRequests);
});

/**
 * @desc    Get received friendship requests
 * @route   GET /api/friendships/requests/received
 * @access  Private
 */
export const getFriendshipRequestsReceived = asyncHandler(async (req, res) => {
  const receivedRequests = await Friendship.find({
    recipient_id: req.user._id,
    status: "pending",
  }).populate("requester_id", "name email profile_picture status");

  res.json(receivedRequests);
});
