import { getAuthContext } from "../middlewares";
import { asyncHandler, ok } from "../lib/http";
import { listAdminScores, listAdminSubscriptions, listAdminUsers, updateAdminScore, updateAdminSubscription, updateAdminUser } from "../services/admin.service";
import { buildAdminDashboard } from "../services/dashboard.service";
import { listWinnerClaims, markWinnerPaid, reviewWinner } from "../services/winner.service";
import type { AdminSubscriptionUpdateInput, AdminUserUpdateInput } from "../validators/admin.validator";
import type { IdParam } from "../validators/common.validator";
import type { ScoreInput } from "../validators/user.validator";
import type { PayoutUpdateInput, WinnerReviewInput } from "../validators/winner.validator";

export const adminDashboardController = asyncHandler("admin.adminDashboardController", async (_req, res) => {
  ok(res, await buildAdminDashboard());
});

export const adminUsersController = asyncHandler("admin.adminUsersController", async (_req, res) => {
  ok(res, await listAdminUsers());
});

export const updateAdminUserController = asyncHandler("admin.updateAdminUserController", async (req, res) => {
  const { user } = getAuthContext(req);
  const params = req.params as IdParam;
  ok(res, await updateAdminUser(params.id, req.body as AdminUserUpdateInput, user._id.toString()));
});

export const adminSubscriptionsController = asyncHandler("admin.adminSubscriptionsController", async (_req, res) => {
  ok(res, await listAdminSubscriptions());
});

export const updateAdminSubscriptionController = asyncHandler("admin.updateAdminSubscriptionController", async (req, res) => {
  const { user } = getAuthContext(req);
  const params = req.params as IdParam;
  ok(res, await updateAdminSubscription(params.id, req.body as AdminSubscriptionUpdateInput, user._id.toString()));
});

export const adminScoresController = asyncHandler("admin.adminScoresController", async (_req, res) => {
  ok(res, await listAdminScores());
});

export const updateAdminScoreController = asyncHandler("admin.updateAdminScoreController", async (req, res) => {
  const { user } = getAuthContext(req);
  const params = req.params as IdParam;
  ok(res, await updateAdminScore(params.id, req.body as ScoreInput, user._id.toString()));
});

export const adminWinnerClaimsController = asyncHandler("admin.adminWinnerClaimsController", async (_req, res) => {
  ok(res, await listWinnerClaims());
});

export const reviewWinnerController = asyncHandler("admin.reviewWinnerController", async (req, res) => {
  const { user } = getAuthContext(req);
  const params = req.params as IdParam;
  ok(res, await reviewWinner(params.id, req.body as WinnerReviewInput, user._id.toString()));
});

export const payWinnerController = asyncHandler("admin.payWinnerController", async (req, res) => {
  const { user } = getAuthContext(req);
  const params = req.params as IdParam;
  ok(res, await markWinnerPaid(params.id, req.body as PayoutUpdateInput, user._id.toString()));
});
