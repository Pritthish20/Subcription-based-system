import { Schema } from "mongoose";

export const subscriptionTransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription" },
    planId: { type: Schema.Types.ObjectId, ref: "Plan" },
    source: { type: String, enum: ["razorpay", "manual"], default: "manual" },
    eventType: { type: String, required: true },
    amountInr: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    providerReference: { type: String },
    status: { type: String, required: true }
  },
  { timestamps: true }
);

export const donationAllocationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    charityId: { type: Schema.Types.ObjectId, ref: "Charity", required: true },
    subscriptionTransactionId: { type: Schema.Types.ObjectId, ref: "SubscriptionTransaction" },
    type: { type: String, enum: ["subscription", "independent"], required: true },
    amountInr: { type: Number, required: true },
    percentage: { type: Number },
    message: { type: String },
    source: { type: String, enum: ["razorpay", "manual"], default: "manual" },
    providerReference: { type: String },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" }
  },
  { timestamps: true }
);

export const prizeAllocationSchema = new Schema(
  {
    drawCycleId: { type: Schema.Types.ObjectId, ref: "DrawCycle", required: true },
    totalPrizePool: { type: Number, required: true },
    fiveMatchPool: { type: Number, required: true },
    fourMatchPool: { type: Number, required: true },
    threeMatchPool: { type: Number, required: true },
    rolloverAmount: { type: Number, required: true },
    winnerCounts: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 }
    },
    splitAmounts: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);
