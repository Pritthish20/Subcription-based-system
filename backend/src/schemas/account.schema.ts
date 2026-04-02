import { Schema } from "mongoose";
import { CHARITY_MIN_PERCENTAGE } from "../../../shared/src/index";

export const userSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["subscriber", "admin"], default: "subscriber" },
    selectedCharityId: { type: Schema.Types.ObjectId, ref: "Charity" },
    charityPercentage: { type: Number, default: CHARITY_MIN_PERCENTAGE },
    accountState: { type: String, enum: ["pending", "active", "inactive"], default: "pending" },
    refreshTokenHash: { type: String },
    resetPasswordTokenHash: { type: String },
    resetPasswordExpiresAt: { type: Date }
  },
  { timestamps: true }
);

export const planSchema = new Schema(
  {
    name: { type: String, required: true },
    interval: { type: String, enum: ["monthly", "yearly"], required: true, unique: true },
    amountInr: { type: Number, required: true },
    charityDefaultPercentage: { type: Number, default: CHARITY_MIN_PERCENTAGE },
    prizePoolContributionPercentage: { type: Number, default: 40 },
    paymentProvider: { type: String, enum: ["razorpay"], default: "razorpay" },
    providerPlanId: { type: String }
  },
  { timestamps: true }
);

export const subscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    status: { type: String, enum: ["incomplete", "active", "past_due", "cancelled", "lapsed"], default: "incomplete" },
    paymentProvider: { type: String, enum: ["razorpay"], default: "razorpay" },
    providerCustomerId: { type: String },
    providerSubscriptionId: { type: String },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String }
  },
  { timestamps: true }
);

export const scoreEntrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    score: { type: Number, required: true },
    playedAt: { type: Date, required: true },
    notes: { type: String }
  },
  { timestamps: true }
);
