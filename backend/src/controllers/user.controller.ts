import { asyncHandler, ok, ApiError } from "../lib/http";
import { getAuthContext } from "../middlewares";
import { ScoreEntry } from "../models";
import { createWinnerProofUploadSignature } from "../services/winner.service";
import { addScore, buildSubscriberDashboard, getCurrentUser, listScores, submitWinnerProof, updateCurrentUser, updateScore } from "../services/user.service";
import { handleOneTimeDonation } from "../services/billing.service";
import type { OneTimeDonationInput, ScoreInput, UpdateProfileInput, WinnerProofInput } from "../validators/user.validator";
import type { IdParam } from "../validators/common.validator";

export const meController = asyncHandler("user.meController", async (req, res) => {
  const { user } = getAuthContext(req);
  ok(res, await getCurrentUser(user._id.toString()));
});

export const updateMeController = asyncHandler("user.updateMeController", async (req, res) => {
  const { user } = getAuthContext(req);
  ok(res, await updateCurrentUser(user._id.toString(), req.body as UpdateProfileInput));
});

export const listScoresController = asyncHandler("user.listScoresController", async (req, res) => {
  const { user } = getAuthContext(req);
  ok(res, await listScores(user._id.toString()));
});

export const createScoreController = asyncHandler("user.createScoreController", async (req, res) => {
  const { user } = getAuthContext(req);
  ok(res, await addScore(user._id.toString(), req.body as ScoreInput), 201);
});

export const updateScoreController = asyncHandler("user.updateScoreController", async (req, res) => {
  const { payload } = getAuthContext(req);
  const params = req.params as IdParam;
  const score = await ScoreEntry.findById(params.id);
  if (!score) throw new ApiError(404, "Score not found", { code: "SCORE_NOT_FOUND" });
  if (payload.role !== "admin" && score.userId.toString() !== payload.userId) throw new ApiError(403, "Forbidden", { code: "SCORE_FORBIDDEN" });
  ok(res, await updateScore(params.id, req.body as ScoreInput));
});

export const subscriberDashboardController = asyncHandler("user.subscriberDashboardController", async (req, res) => {
  const { user } = getAuthContext(req);
  ok(res, await buildSubscriberDashboard(user._id.toString()));
});

export const donationController = asyncHandler("user.donationController", async (req, res) => {
  const { user } = getAuthContext(req);
  ok(res, await handleOneTimeDonation(user._id.toString(), req.body as OneTimeDonationInput), 201);
});

export const winnerProofSignatureController = asyncHandler("user.winnerProofSignatureController", async (req, res) => {
  const { user } = getAuthContext(req);
  ok(res, await createWinnerProofUploadSignature(user._id.toString()));
});

export const submitWinnerProofController = asyncHandler("user.submitWinnerProofController", async (req, res) => {
  const { user } = getAuthContext(req);
  const params = req.params as IdParam;
  ok(res, await submitWinnerProof(params.id, req.body as WinnerProofInput, user._id.toString()));
});
