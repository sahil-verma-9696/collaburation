import { Router } from "express";
import { search } from "./search.controller.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = Router();

router.get("/search", protect, search);
// router.get("/profile/:user_id", protect, me);
// router.put("/profile", login);

export default router;
