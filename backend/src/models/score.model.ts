import { InferSchemaType, Model, model, models } from "mongoose";
import { scoreEntrySchema } from "../schemas/account.schema";

export type ScoreDoc = InferSchemaType<typeof scoreEntrySchema>;
export const ScoreEntry = (models.ScoreEntry as Model<ScoreDoc>) || model<ScoreDoc>("ScoreEntry", scoreEntrySchema);
