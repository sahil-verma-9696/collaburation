import { Router } from "express";
import {
  deleteMessage,
  getMessage,
  sendMessage,
  updateReadMessage,
} from "./controller.js";

const router = Router();

router.get("/:user_id", getMessage);
router.post("/", sendMessage);
router.put("/:message_id/read", updateReadMessage);
router.delete("/:message_id", deleteMessage);

export default router;
