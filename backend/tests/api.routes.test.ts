import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  refreshUserSession: vi.fn(),
  logoutUserSession: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  listPlans: vi.fn(),
  handleCheckout: vi.fn(),
  handleSubscriptionVerification: vi.fn(),
  handleDonationVerification: vi.fn(),
  cancelSubscription: vi.fn(),
  handleWebhook: vi.fn(),
  listCharities: vi.fn(),
  getCharityBySlug: vi.fn(),
  createCharity: vi.fn(),
  updateCharity: vi.fn(),
  deleteCharity: vi.fn(),
  getCurrentUser: vi.fn(),
  updateCurrentUser: vi.fn(),
  listScores: vi.fn(),
  addScore: vi.fn(),
  updateScore: vi.fn(),
  buildSubscriberDashboard: vi.fn(),
  handleOneTimeDonation: vi.fn(),
  submitWinnerProof: vi.fn(),
  listAdminUsers: vi.fn(),
  updateAdminUser: vi.fn(),
  listAdminSubscriptions: vi.fn(),
  updateAdminSubscription: vi.fn(),
  listAdminScores: vi.fn(),
  updateAdminScore: vi.fn(),
  buildAdminDashboard: vi.fn(),
  simulateDraw: vi.fn(),
  publishDraw: vi.fn(),
  listWinnerClaims: vi.fn(),
  markWinnerPaid: vi.fn(),
  reviewWinner: vi.fn(),
  createWinnerProofUploadSignature: vi.fn(),
  verifyAccessToken: vi.fn(),
  userFindById: vi.fn(),
  subscriptionFindOne: vi.fn(),
  scoreEntryFindById: vi.fn(),
  drawCycleFind: vi.fn()
}));

vi.mock("../src/config", () => ({
  getEnv: () => ({
    MONGODB_URI: "mongodb://127.0.0.1:27017/test",
    JWT_ACCESS_SECRET: "test-access-secret",
    JWT_REFRESH_SECRET: "test-refresh-secret",
    EMAIL_PROVIDER: "mock",
    EMAIL_FROM: "no-reply@test.dev",
    APP_URL: "https://frontend.golf.test",
    ADDITIONAL_ALLOWED_ORIGINS: "https://preview.golf.test"
  }),
  verifyAccessToken: mocks.verifyAccessToken,
  isAllowedOrigin: (origin?: string) => !origin || ["https://frontend.golf.test", "https://preview.golf.test"].includes(origin),
  signAccessToken: vi.fn(),
  signRefreshToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
  sendEmail: vi.fn(),
  configureCloudinary: vi.fn(),
  getCloudinaryUploadSignature: vi.fn(),
  getRazorpay: vi.fn(() => null),
  connectDb: vi.fn()
}));

vi.mock("../src/services/auth.service", () => ({
  registerUser: mocks.registerUser,
  loginUser: mocks.loginUser,
  refreshUserSession: mocks.refreshUserSession,
  logoutUserSession: mocks.logoutUserSession,
  requestPasswordReset: mocks.requestPasswordReset,
  resetPassword: mocks.resetPassword
}));

vi.mock("../src/services/billing.service", () => ({
  listPlans: mocks.listPlans,
  handleCheckout: mocks.handleCheckout,
  handleSubscriptionVerification: mocks.handleSubscriptionVerification,
  handleDonationVerification: mocks.handleDonationVerification,
  cancelSubscription: mocks.cancelSubscription,
  handleWebhook: mocks.handleWebhook
}));

vi.mock("../src/services/charity.service", () => ({
  listCharities: mocks.listCharities,
  getCharityBySlug: mocks.getCharityBySlug,
  createCharity: mocks.createCharity,
  updateCharity: mocks.updateCharity,
  deleteCharity: mocks.deleteCharity
}));

vi.mock("../src/services/user.service", () => ({
  getCurrentUser: mocks.getCurrentUser,
  updateCurrentUser: mocks.updateCurrentUser,
  listScores: mocks.listScores,
  addScore: mocks.addScore,
  updateScore: mocks.updateScore,
  buildSubscriberDashboard: mocks.buildSubscriberDashboard,
  handleOneTimeDonation: mocks.handleOneTimeDonation,
  submitWinnerProof: mocks.submitWinnerProof
}));

vi.mock("../src/services/admin.service", () => ({
  listAdminUsers: mocks.listAdminUsers,
  updateAdminUser: mocks.updateAdminUser,
  listAdminSubscriptions: mocks.listAdminSubscriptions,
  updateAdminSubscription: mocks.updateAdminSubscription,
  listAdminScores: mocks.listAdminScores,
  updateAdminScore: mocks.updateAdminScore
}));

vi.mock("../src/services/dashboard.service", () => ({
  buildAdminDashboard: mocks.buildAdminDashboard,
  listUsers: vi.fn()
}));

vi.mock("../src/services/draw.service", () => ({
  simulateDraw: mocks.simulateDraw,
  publishDraw: mocks.publishDraw
}));

vi.mock("../src/services/winner.service", () => ({
  listWinnerClaims: mocks.listWinnerClaims,
  reviewWinner: mocks.reviewWinner,
  markWinnerPaid: mocks.markWinnerPaid,
  createWinnerProofUploadSignature: mocks.createWinnerProofUploadSignature
}));

vi.mock("../src/models", () => ({
  User: { findById: mocks.userFindById },
  Subscription: { findOne: mocks.subscriptionFindOne },
  ScoreEntry: { findById: mocks.scoreEntryFindById },
  DrawCycle: { find: mocks.drawCycleFind }
}));

import { createApp } from "../src/app";

const subscriberUser = {
  _id: "user-1",
  fullName: "Subscriber One",
  email: "subscriber@example.com",
  role: "subscriber",
  accountState: "active"
};

const adminUser = {
  _id: "admin-1",
  fullName: "Admin One",
  email: "admin@example.com",
  role: "admin",
  accountState: "active"
};

function subscriptionResult(subscription: unknown) {
  return { sort: vi.fn().mockResolvedValue(subscription) };
}

function drawResultsResult(draws: unknown[]) {
  return { sort: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(draws) }) };
}

describe("API route integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.verifyAccessToken.mockImplementation((token: string) => (token === "admin-token" ? { userId: "admin-1", role: "admin" } : { userId: "user-1", role: "subscriber" }));
    mocks.userFindById.mockImplementation(async (id: string) => (id === "admin-1" ? adminUser : subscriberUser));
    mocks.subscriptionFindOne.mockReturnValue(subscriptionResult({ status: "active", currentPeriodEnd: new Date(Date.now() + 86_400_000) }));
    mocks.drawCycleFind.mockReturnValue(drawResultsResult([]));

    mocks.loginUser.mockResolvedValue({ accessToken: "access-token", refreshToken: "refresh-token", user: subscriberUser });
    mocks.registerUser.mockResolvedValue({ accessToken: "registered-token", refreshToken: "registered-refresh", user: subscriberUser });
    mocks.listAdminUsers.mockResolvedValue([subscriberUser]);
    mocks.buildAdminDashboard.mockResolvedValue({ totalUsers: 9, activeSubscriptions: 7 });
    mocks.addScore.mockResolvedValue({ _id: "score-1", score: 38, playedAt: "2026-03-21T10:00:00.000Z" });
    mocks.simulateDraw.mockResolvedValue({ simulatedNumbers: [3, 8, 14, 21, 33] });
    mocks.publishDraw.mockResolvedValue({ draw: { month: "2026-03", officialNumbers: [3, 8, 14, 21, 33] } });
  });

  it("serves the health check and allows configured preview origins", async () => {
    const app = createApp();
    const response = await request(app).get("/api/health").set("Origin", "https://preview.golf.test");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe("https://preview.golf.test");
    expect(response.body.data.status).toBe("ok");
  });

  it("rejects malformed register payloads before the controller runs", async () => {
    const app = createApp();
    const response = await request(app).post("/api/auth/register").send({ email: "bad" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(mocks.registerUser).not.toHaveBeenCalled();
  });

  it("returns login data for a valid auth request", async () => {
    const app = createApp();
    const response = await request(app).post("/api/auth/login").send({ email: "subscriber@example.com", password: "Password@123" });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBe("access-token");
    expect(mocks.loginUser).toHaveBeenCalledWith({ email: "subscriber@example.com", password: "Password@123" });
  });

  it("blocks admin routes when authentication is missing", async () => {
    const app = createApp();
    const response = await request(app).get("/api/admin/users");

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe("Authentication required");
  });

  it("blocks admin routes for authenticated non-admin users", async () => {
    const app = createApp();
    const response = await request(app).get("/api/admin/users").set("Authorization", "Bearer subscriber-token");

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe("Forbidden");
    expect(mocks.listAdminUsers).not.toHaveBeenCalled();
  });

  it("returns admin user data for authenticated admins", async () => {
    const app = createApp();
    const response = await request(app).get("/api/admin/users").set("Authorization", "Bearer admin-token");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([subscriberUser]);
    expect(mocks.listAdminUsers).toHaveBeenCalledTimes(1);
  });

  it("requires an active subscription before exposing score routes", async () => {
    mocks.subscriptionFindOne.mockReturnValue(subscriptionResult(null));
    const app = createApp();
    const response = await request(app).get("/api/scores").set("Authorization", "Bearer subscriber-token");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("SUBSCRIPTION_REQUIRED");
    expect(mocks.listScores).not.toHaveBeenCalled();
  });

  it("rejects invalid score payloads before calling the score service", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/scores")
      .set("Authorization", "Bearer subscriber-token")
      .send({ score: 52, playedAt: "not-a-date" });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("Validation failed");
    expect(mocks.addScore).not.toHaveBeenCalled();
  });

  it("creates a score for an active subscriber", async () => {
    const app = createApp();
    const payload = { score: 38, playedAt: "2026-03-21T10:00:00.000Z", notes: "Club medal" };
    const response = await request(app)
      .post("/api/scores")
      .set("Authorization", "Bearer subscriber-token")
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.data.score).toBe(38);
    expect(mocks.addScore).toHaveBeenCalledWith("user-1", payload);
  });

  it("validates draw simulation payloads before the admin service runs", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/draws/simulate")
      .set("Authorization", "Bearer admin-token")
      .send({ month: "March-2026", mode: "weighted" });

    expect(response.status).toBe(400);
    expect(mocks.simulateDraw).not.toHaveBeenCalled();
  });

  it("publishes draw results for admins", async () => {
    const app = createApp();
    const payload = { month: "2026-03", mode: "random", numbers: [3, 8, 14, 21, 33] };
    const response = await request(app)
      .post("/api/draws/publish")
      .set("Authorization", "Bearer admin-token")
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.data.draw.month).toBe("2026-03");
    expect(mocks.publishDraw).toHaveBeenCalledWith(payload, "admin-1");
  });

  it("returns structured 404 payloads for unknown routes", async () => {
    const app = createApp();
    const response = await request(app).get("/api/unknown");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
    expect(response.body.error.requestId).toBeTruthy();
  });
});
