import { Router } from "express";

import { signup } from "./signup.controller.js";
import { login } from "./login.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { me } from "./me.controller.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, me);

export default router;
