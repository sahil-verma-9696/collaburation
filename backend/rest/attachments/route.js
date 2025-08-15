import { Router } from "express";
import { deleteAttachment, getAttachmentById, getUploadCred, updateAttachment, uploadAttachemnt } from "./controller.js";

const router = Router();

router.get("/:id", getAttachmentById);
router.get("/upload-cred", getUploadCred);
router.post("/upload", uploadAttachemnt);
router.put("/:id", updateAttachment);
router.delete("/:id", deleteAttachment);

export default router;
