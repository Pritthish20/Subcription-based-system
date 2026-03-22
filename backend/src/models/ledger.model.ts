import { Model, model, models } from "mongoose";
import { donationAllocationSchema, prizeAllocationSchema, subscriptionTransactionSchema } from "../schemas/ledger.schema";

export const SubscriptionTransaction = (models.SubscriptionTransaction as Model<any>) || model("SubscriptionTransaction", subscriptionTransactionSchema);
export const DonationAllocation = (models.DonationAllocation as Model<any>) || model("DonationAllocation", donationAllocationSchema);
export const PrizeAllocation = (models.PrizeAllocation as Model<any>) || model("PrizeAllocation", prizeAllocationSchema);
