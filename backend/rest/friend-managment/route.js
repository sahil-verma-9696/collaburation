import { Router } from "express";
import { protect } from "./../../middleware/authMiddleware.js";
import {
  acceptFriendship,
  createFriendship,
  deleteFriendship,
  getFriendshipRequests,
  getFriendshipRequestsReceived,
  getFriendships,
  rejectFriendship,
} from "./controller.js";

const router = Router();

router.get("/", protect, getFriendships);
router.post("/request", protect, createFriendship);
router.put("/:friendship_id/accept", protect, acceptFriendship);
router.put("/:friendship_id/reject", protect, rejectFriendship);
router.delete("/:friendship_id", protect, deleteFriendship);

router.get("/requests/sent", protect, getFriendshipRequests);
router.get("/requests/received", protect, getFriendshipRequestsReceived);

export default router;
