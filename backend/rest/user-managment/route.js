import { Router } from "express";
import { search } from "./search.controller.js";
import { getProfile, updateProfile } from "./profile.controller.js";

const router = Router();

router.get("/search", search);
router.get("/profile/:id", getProfile);
router.put("/profile", updateProfile);

export default router;
