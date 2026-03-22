import { InferSchemaType, Model, model, models } from "mongoose";
import { charityDbSchema } from "../schemas/charity.schema";

export type CharityDoc = InferSchemaType<typeof charityDbSchema>;
export const Charity = (models.Charity as Model<CharityDoc>) || model<CharityDoc>("Charity", charityDbSchema);
