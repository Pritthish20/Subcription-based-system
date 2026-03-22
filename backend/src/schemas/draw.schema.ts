import { Schema } from "mongoose";

export const drawCycleSchema = new Schema(
  {
    month: { type: String, required: true, unique: true },
    mode: { type: String, enum: ["random", "weighted"], required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    eligibilitySnapshot: { type: [Schema.Types.Mixed], default: [] },
    officialNumbers: { type: [Number], default: [] },
    rolloverAmount: { type: Number, default: 0 },
    publishedAt: { type: Date }
  },
  { timestamps: true }
);

export const drawSimulationSchema = new Schema(
  {
    month: { type: String, required: true },
    mode: { type: String, enum: ["random", "weighted"], required: true },
    simulatedNumbers: { type: [Number], required: true },
    insight: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);
