import { Schema } from "mongoose";

export const winnerClaimSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    drawCycleId: { type: Schema.Types.ObjectId, ref: "DrawCycle", required: true },
    tier: { type: String, enum: ["five", "four", "three"], required: true },
    proofUrl: { type: String },
    proofNotes: { type: String },
    reviewStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    payoutStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    adminNotes: { type: String },
    prizeAmount: { type: Number, default: 0 },
    reviewedAt: { type: Date },
    paidAt: { type: Date }
  },
  { timestamps: true }
);

export const payoutRecordSchema = new Schema(
  {
    winnerClaimId: { type: Schema.Types.ObjectId, ref: "WinnerClaim", required: true },
    amountInr: { type: Number, required: true },
    reference: { type: String, required: true },
    paidAt: { type: Date, required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);
