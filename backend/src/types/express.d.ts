import type { HydratedDocument } from "mongoose";
import type { AuthPayload } from "../config";
import type { UserDoc } from "../models/user.model";
import type { SubscriptionDoc } from "../models/billing.model";

type SubscriptionAccessState = "active" | "inactive" | "cancelled" | "past_due" | "lapsed" | "missing";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
      currentUser?: HydratedDocument<UserDoc>;
      currentSubscription?: HydratedDocument<SubscriptionDoc> | null;
      subscriptionAccess?: {
        state: SubscriptionAccessState;
        checkedAt: string;
        reason?: string;
      };
      requestId?: string;
      requestStartedAt?: number;
      controllerName?: string;
    }
  }
}

export {};