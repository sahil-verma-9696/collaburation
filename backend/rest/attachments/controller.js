import { configDotenv } from "dotenv";

import getSignature from "./../../cloudinary/uploadSign.js";
import Attachment from "../../models/Attachment.js";
configDotenv();

export const getUploadCred = (req, res) => {
  const { folderName = "images" } = req.params;
  const CLOUDNAME = process.env.CLOUDINARY_CLOUDNAME;
  const API_KEY = process.env.CLOUDINARY_API_KEY;

  const signature = getSignature(folderName);
  res.status(200).json({ CLOUDNAME, API_KEY, ...signature });
};

export const getAttachmentById = async (req, res) => {
  const { id } = req.params;
  const attachment = await Attachment.findById(id);
  if (!attachment) {
    const err = new Error("Attachment not found");
    err.statusCode = 404;
    throw err;
  }
  res.status(200).json({ message: "Attachment found", data: attachment });
};

export const uploadAttachemnt = async (req, res) => {
  const { url, file_size, filename, mime_type } = req.body;

  if (!url || !file_size || !filename || !mime_type) {
    const err = new Error(
      "All fields url, file_size, filename, mime_type are required"
    );
    err.statusCode = 400;
    throw err;
  }

  const newAttach = await Attachment.create({
    url,
    file_size,
    filename,
    mime_type,
  });
  res.status(200).json({ message: "Attachment uploaded", data: newAttach });
};

export const updateAttachment = async (req, res) => {
  const { id } = req.params;
  const { url, file_size, filename, mime_type } = req.body;
  const attachment = await Attachment.findById(id);
  if (!attachment) {
    const err = new Error("Attachment not found");
    err.statusCode = 404;
    throw err;
  }
  attachment.url = url;
  attachment.file_size = file_size;
  attachment.filename = filename;
  attachment.mime_type = mime_type;
  await attachment.save();
  res.status(200).json({ message: "Attachment updated", data: attachment });
};

export const deleteAttachment = async (req, res) => {
  const { id } = req.params;
  const attachment = await Attachment.findById(id);
  if (!attachment) {
    const err = new Error("Attachment not found");
    err.statusCode = 404;
    throw err;
  }
  await attachment.deleteOne();
  res.status(200).json({ message: "Attachment deleted" });
};
