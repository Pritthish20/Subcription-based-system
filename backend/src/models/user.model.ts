import { InferSchemaType, Model, model, models } from "mongoose";
import { userSchema } from "../schemas/account.schema";

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = (models.User as Model<UserDoc>) || model<UserDoc>("User", userSchema);
