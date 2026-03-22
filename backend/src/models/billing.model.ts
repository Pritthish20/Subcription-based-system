import { InferSchemaType, Model, model, models } from "mongoose";
import { planSchema, subscriptionSchema } from "../schemas/account.schema";

export type PlanDoc = InferSchemaType<typeof planSchema>;
export type SubscriptionDoc = InferSchemaType<typeof subscriptionSchema>;

export const Plan = (models.Plan as Model<PlanDoc>) || model<PlanDoc>("Plan", planSchema);
export const Subscription = (models.Subscription as Model<SubscriptionDoc>) || model<SubscriptionDoc>("Subscription", subscriptionSchema);
