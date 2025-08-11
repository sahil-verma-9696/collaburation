import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    file_size: {
      type: Number, // in bytes
      required: true,
      min: 0,
    },
    mime_type: {
      type: String,
      required: true,
      trim: true,
    },
    uploaded_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // uploaded_at is enough here
  }
);

const Attachment = mongoose.model("Attachment", attachmentSchema);

export default Attachment;
