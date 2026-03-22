import { Schema } from "mongoose";

export const charityDbSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    featured: { type: Boolean, default: false },
    imageUrl: { type: String, required: true },
    events: [{ title: String, startsAt: Date, location: String }]
  },
  { timestamps: true }
);
