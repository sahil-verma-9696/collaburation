import { Router } from "express";
import { search } from "./search.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { getProfile } from "./profile.controller.js";

const router = Router();

router.get("/search", protect, search);
router.get("/profile/:id", protect, getProfile);
// router.put("/profile", login);

export default router;
