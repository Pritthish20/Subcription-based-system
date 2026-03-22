import { InferSchemaType, Model, model, models } from "mongoose";
import { winnerClaimSchema, payoutRecordSchema } from "../schemas/winner.schema";

export type WinnerClaimDoc = InferSchemaType<typeof winnerClaimSchema>;
export const WinnerClaim = (models.WinnerClaim as Model<WinnerClaimDoc>) || model<WinnerClaimDoc>("WinnerClaim", winnerClaimSchema);
export const PayoutRecord = (models.PayoutRecord as Model<any>) || model("PayoutRecord", payoutRecordSchema);
