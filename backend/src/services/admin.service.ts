import type { AdminSubscriptionUpdateInput, AdminUserUpdateInput } from "../validators/admin.validator";
import type { ScoreInput } from "../validators/user.validator";
import { ApiError, runService } from "../lib/http";
import { Charity, ScoreEntry, Subscription, User } from "../models";
import { recordAdminAction } from "./audit.service";

export async function listAdminUsers() {
  return runService("admin.service", "listAdminUsers", async () => {
    return User.find().populate("selectedCharityId", "name").sort({ createdAt: -1 }).limit(100);
  });
}

export async function updateAdminUser(userId: string, payload: AdminUserUpdateInput, adminId?: string) {
  return runService("admin.service", "updateAdminUser", async () => {
    if (!(await Charity.findById(payload.selectedCharityId))) {
      throw new ApiError(404, "Charity not found", { code: "CHARITY_NOT_FOUND" });
    }

    const before = await User.findById(userId).populate("selectedCharityId", "name");
    const user = await User.findByIdAndUpdate(
      userId,
      {
        fullName: payload.fullName,
        email: payload.email.toLowerCase(),
        role: payload.role,
        accountState: payload.accountState,
        selectedCharityId: payload.selectedCharityId,
        charityPercentage: payload.charityPercentage
      },
      { new: true }
    ).populate("selectedCharityId", "name");

    if (!user) throw new ApiError(404, "User not found", { code: "USER_NOT_FOUND" });

    if (adminId) {
      await recordAdminAction({
        adminId,
        action: "user.updated",
        targetType: "user",
        targetId: userId,
        before,
        after: user
      });
    }

    return user;
  });
}

export async function listAdminSubscriptions() {
  return runService("admin.service", "listAdminSubscriptions", async () => {
    return Subscription.find().populate("userId", "fullName email").populate("planId", "name interval amountInr").sort({ updatedAt: -1 }).limit(100);
  });
}

export async function updateAdminSubscription(subscriptionId: string, payload: AdminSubscriptionUpdateInput, adminId?: string) {
  return runService("admin.service", "updateAdminSubscription", async () => {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) throw new ApiError(404, "Subscription not found", { code: "SUBSCRIPTION_NOT_FOUND" });

    const before = subscription.toObject();
    subscription.status = payload.status;
    subscription.currentPeriodEnd = payload.currentPeriodEnd ? new Date(payload.currentPeriodEnd) : undefined;
    subscription.cancellationReason = payload.cancellationReason;
    if (payload.status === "cancelled") {
      subscription.cancelledAt = new Date();
    }
    await subscription.save();

    const user = await User.findById(subscription.userId);
    if (user) {
      user.accountState = payload.status === "active" ? "active" : "inactive";
      await user.save();
    }

    const updated = await Subscription.findById(subscriptionId).populate("userId", "fullName email").populate("planId", "name interval amountInr");

    if (adminId && updated) {
      await recordAdminAction({
        adminId,
        action: "subscription.updated",
        targetType: "subscription",
        targetId: subscriptionId,
        before,
        after: updated
      });
    }

    return updated;
  });
}

export async function listAdminScores() {
  return runService("admin.service", "listAdminScores", async () => {
    return ScoreEntry.find().populate("userId", "fullName email").sort({ playedAt: -1, updatedAt: -1 }).limit(100);
  });
}

export async function updateAdminScore(scoreId: string, payload: ScoreInput, adminId?: string) {
  return runService("admin.service", "updateAdminScore", async () => {
    const score = await ScoreEntry.findById(scoreId);
    if (!score) throw new ApiError(404, "Score not found", { code: "SCORE_NOT_FOUND" });

    const before = score.toObject();
    score.score = payload.score;
    score.playedAt = new Date(payload.playedAt);
    score.notes = payload.notes;
    await score.save();

    const updated = await ScoreEntry.findById(scoreId).populate("userId", "fullName email");

    if (adminId && updated) {
      await recordAdminAction({
        adminId,
        action: "score.updated",
        targetType: "score",
        targetId: scoreId,
        before,
        after: updated
      });
    }

    return updated;
  });
}
