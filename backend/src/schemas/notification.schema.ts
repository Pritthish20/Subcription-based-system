import { Schema } from "mongoose";

export const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    channel: { type: String, default: "email" },
    recipient: { type: String },
    subject: { type: String },
    event: { type: String, required: true },
    payload: { type: Schema.Types.Mixed },
    provider: { type: String, default: "mock" },
    providerMessageId: { type: String },
    errorMessage: { type: String },
    sentAt: { type: Date },
    status: { type: String, enum: ["queued", "sent", "failed", "skipped"], default: "queued" }
  },
  { timestamps: true }
);
