import type { RequestHandler } from "express";
import { ApiError } from "../lib/http";
import { Subscription } from "../models";

function isSubscriptionExpired(subscription: { currentPeriodEnd?: Date | null }) {
  return !!subscription.currentPeriodEnd && subscription.currentPeriodEnd.getTime() < Date.now();
}

export const hydrateSubscriptionAccess: RequestHandler = async (req, _res, next) => {
  try {
    if (!req.currentUser) {
      next(new ApiError(401, "Authentication required", { code: "AUTH_REQUIRED" }));
      return;
    }

    const subscription = await Subscription.findOne({ userId: req.currentUser._id }).sort({ updatedAt: -1 });
    req.currentSubscription = subscription;

    if (!subscription) {
      req.subscriptionAccess = { state: "missing", checkedAt: new Date().toISOString(), reason: "No subscription record found" };
      next();
      return;
    }

    if (subscription.status === "active" && isSubscriptionExpired(subscription)) {
      subscription.status = "lapsed";
      await subscription.save();
      if (req.currentUser.accountState !== "inactive") {
        req.currentUser.accountState = "inactive";
        await req.currentUser.save();
      }
    }

    const state = subscription.status === "active" ? "active" : subscription.status;
    req.subscriptionAccess = {
      state: state === "incomplete" ? "inactive" : state,
      checkedAt: new Date().toISOString(),
      reason: state === "active" ? undefined : `Subscription status is ${subscription.status}`
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireActiveSubscription: RequestHandler = (req, _res, next) => {
  if (!req.currentUser) {
    next(new ApiError(401, "Authentication required", { code: "AUTH_REQUIRED" }));
    return;
  }

  const access = req.subscriptionAccess;
  if (!access || access.state === "missing") {
    next(new ApiError(403, "Active subscription required", { code: "SUBSCRIPTION_REQUIRED", context: { state: access?.state ?? "missing" } }));
    return;
  }

  if (access.state !== "active") {
    next(new ApiError(403, "Active subscription required", { code: "SUBSCRIPTION_INACTIVE", context: { state: access.state, reason: access.reason } }));
    return;
  }

  next();
};