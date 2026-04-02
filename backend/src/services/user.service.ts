import { SCORE_LIMIT, type ScoreInput, type UpdateProfileInput, type WinnerProofInput } from "../../../shared/src/index";
import { getEnv, isDemoEnv } from "../config";
import { ApiError, runService } from "../lib/http";
import { Charity, DrawCycle, ScoreEntry, Subscription, User, WinnerClaim } from "../models";

function toMonthKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function addMonths(month: string, offset: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthIndex - 1 + offset, 1));
  return toMonthKey(date);
}

function subscriptionIsActive(subscription: { status?: string; currentPeriodEnd?: Date | string | null } | null | undefined) {
  if (!subscription || subscription.status !== "active") return false;
  if (!subscription.currentPeriodEnd) return true;
  return new Date(subscription.currentPeriodEnd).getTime() > Date.now();
}

function isEligibleForDraw(draw: { eligibilitySnapshot?: Array<{ userId?: string | { toString(): string } }> } | null | undefined, userId: string) {
  return (draw?.eligibilitySnapshot ?? []).some((entry) => {
    const entryUserId = typeof entry?.userId === "string" ? entry.userId : entry?.userId?.toString?.();
    return entryUserId === userId;
  });
}

function isCloudinaryProofUrl(value: string) {
  try {
    return new URL(value).hostname.includes("res.cloudinary.com");
  } catch {
    return false;
  }
}

export async function getCurrentUser(userId: string) {
  return runService("user.service", "getCurrentUser", async () => User.findById(userId));
}

export async function updateCurrentUser(userId: string, payload: UpdateProfileInput) {
  return runService("user.service", "updateCurrentUser", async () => {
    if (!(await Charity.findById(payload.selectedCharityId))) throw new ApiError(404, "Charity not found", { code: "CHARITY_NOT_FOUND" });
    return User.findByIdAndUpdate(userId, payload, { new: true });
  });
}

export async function listScores(userId: string) {
  return runService("user.service", "listScores", async () => ScoreEntry.find({ userId }).sort({ playedAt: -1, createdAt: -1 }));
}

export async function addScore(userId: string, payload: ScoreInput) {
  return runService("user.service", "addScore", async () => {
    await ScoreEntry.create({ userId, score: payload.score, playedAt: new Date(payload.playedAt), notes: payload.notes });
    const scores = await ScoreEntry.find({ userId }).sort({ playedAt: -1, createdAt: -1 });
    if (scores.length > SCORE_LIMIT) await ScoreEntry.deleteMany({ _id: { $in: scores.slice(SCORE_LIMIT).map((score) => score._id) } });
    return listScores(userId);
  });
}

export async function updateScore(scoreId: string, payload: ScoreInput) {
  return runService("user.service", "updateScore", async () => {
    const score = await ScoreEntry.findById(scoreId);
    if (!score) throw new ApiError(404, "Score not found", { code: "SCORE_NOT_FOUND" });
    score.score = payload.score;
    score.playedAt = new Date(payload.playedAt);
    score.notes = payload.notes;
    await score.save();
    const scores = await ScoreEntry.find({ userId: score.userId }).sort({ playedAt: -1, createdAt: -1 });
    if (scores.length > SCORE_LIMIT) await ScoreEntry.deleteMany({ _id: { $in: scores.slice(SCORE_LIMIT).map((entry) => entry._id) } });
    return listScores(score.userId.toString());
  });
}

export async function buildSubscriberDashboard(userId: string) {
  return runService("user.service", "buildSubscriberDashboard", async () => {
    const [user, subscription, scores, claims, publishedDraws] = await Promise.all([
      User.findById(userId).populate("selectedCharityId"),
      Subscription.findOne({ userId }).populate("planId"),
      ScoreEntry.find({ userId }).sort({ playedAt: -1, createdAt: -1 }),
      WinnerClaim.find({ userId }).sort({ createdAt: -1 }).limit(10),
      DrawCycle.find({ status: "published" }).sort({ month: -1, publishedAt: -1 }).limit(120)
    ]);

    const drawsEntered = publishedDraws.filter((draw) => isEligibleForDraw(draw, userId)).length;
    const latestPublishedMonth = publishedDraws[0]?.month;
    const currentMonth = toMonthKey(new Date());
    const nextScheduledMonth = latestPublishedMonth ? addMonths(latestPublishedMonth, 1) : currentMonth;
    const upcomingMonth = nextScheduledMonth > currentMonth ? nextScheduledMonth : currentMonth;
    const eligible = subscriptionIsActive(subscription);

    return {
      user,
      subscription,
      scores,
      claims,
      drawsEntered,
      winningsTotal: claims.reduce((total, claim) => total + (claim.prizeAmount ?? 0), 0),
      upcomingDraw: {
        month: upcomingMonth,
        eligible,
        status: eligible ? "eligible" : "inactive"
      }
    };
  });
}

export async function submitWinnerProof(claimId: string, payload: WinnerProofInput, userId: string) {
  return runService("user.service", "submitWinnerProof", async () => {
    const claim = await WinnerClaim.findById(claimId);
    if (!claim) throw new ApiError(404, "Winner claim not found", { code: "WINNER_CLAIM_NOT_FOUND" });
    if (claim.userId.toString() !== userId) throw new ApiError(403, "This claim does not belong to the current user", { code: "WINNER_CLAIM_FORBIDDEN" });
    if (!payload.proofUrl) throw new ApiError(400, "A proof upload or proof URL is required", { code: "WINNER_PROOF_REQUIRED" });

    const env = getEnv();
    if (!isDemoEnv(env) && !isCloudinaryProofUrl(payload.proofUrl)) {
      throw new ApiError(400, "Direct proof URLs are allowed only in demo mode. Upload proof through Cloudinary instead.", {
        code: "WINNER_PROOF_UPLOAD_REQUIRED"
      });
    }

    claim.proofUrl = payload.proofUrl;
    claim.proofNotes = payload.notes;
    await claim.save();
    return claim;
  });
}
