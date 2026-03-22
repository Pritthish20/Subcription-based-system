import { SCORE_LIMIT, type ScoreInput, type UpdateProfileInput, type WinnerProofInput } from "../../../shared/src/index";
import { ApiError, runService } from "../lib/http";
import { Charity, ScoreEntry, User, WinnerClaim } from "../models";

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
    const [user, subscription, scores, claims] = await Promise.all([
      User.findById(userId).populate("selectedCharityId"),
      (await import("../models")).Subscription.findOne({ userId }).populate("planId"),
      ScoreEntry.find({ userId }).sort({ playedAt: -1, createdAt: -1 }),
      WinnerClaim.find({ userId }).sort({ createdAt: -1 }).limit(10)
    ]);

    return { user, subscription, scores, claims, drawsEntered: claims.length, winningsTotal: claims.reduce((total, claim) => total + (claim.prizeAmount ?? 0), 0) };
  });
}

export async function submitWinnerProof(claimId: string, payload: WinnerProofInput, userId: string) {
  return runService("user.service", "submitWinnerProof", async () => {
    const claim = await WinnerClaim.findById(claimId);
    if (!claim) throw new ApiError(404, "Winner claim not found", { code: "WINNER_CLAIM_NOT_FOUND" });
    if (claim.userId.toString() !== userId) throw new ApiError(403, "This claim does not belong to the current user", { code: "WINNER_CLAIM_FORBIDDEN" });
    if (!payload.proofUrl) throw new ApiError(400, "A proof upload or proof URL is required", { code: "WINNER_PROOF_REQUIRED" });
    claim.proofUrl = payload.proofUrl;
    claim.proofNotes = payload.notes;
    await claim.save();
    return claim;
  });
}
