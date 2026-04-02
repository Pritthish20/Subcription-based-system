import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getEnv: vi.fn(),
  charityFindById: vi.fn(),
  userFindById: vi.fn(),
  userFindByIdAndUpdate: vi.fn(),
  subscriptionFindOne: vi.fn(),
  scoreFind: vi.fn(),
  scoreCreate: vi.fn(),
  scoreDeleteMany: vi.fn(),
  scoreFindById: vi.fn(),
  winnerClaimFind: vi.fn(),
  winnerClaimFindById: vi.fn(),
  drawCycleFind: vi.fn()
}));

vi.mock("../src/config", () => ({
  getEnv: mocks.getEnv,
  isDemoEnv: (env?: { APP_ENV?: string }) => (env ?? mocks.getEnv()).APP_ENV === "demo"
}));

vi.mock("../src/models", () => ({
  Charity: { findById: mocks.charityFindById },
  User: { findById: mocks.userFindById, findByIdAndUpdate: mocks.userFindByIdAndUpdate },
  Subscription: { findOne: mocks.subscriptionFindOne },
  ScoreEntry: { find: mocks.scoreFind, create: mocks.scoreCreate, deleteMany: mocks.scoreDeleteMany, findById: mocks.scoreFindById },
  WinnerClaim: { find: mocks.winnerClaimFind, findById: mocks.winnerClaimFindById },
  DrawCycle: { find: mocks.drawCycleFind }
}));

import { buildSubscriberDashboard, submitWinnerProof } from "../src/services/user.service";

describe("user.service dashboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T10:00:00.000Z"));
    vi.clearAllMocks();
    mocks.getEnv.mockReturnValue({ APP_ENV: "development" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds dashboard participation from published draw eligibility and exposes the upcoming draw month", async () => {
    mocks.userFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue({ _id: "user-1", fullName: "Subscriber One", selectedCharityId: { _id: "charity-1", name: "Helping Hands" }, charityPercentage: 15 })
    });
    mocks.subscriptionFindOne.mockReturnValue({
      populate: vi.fn().mockResolvedValue({ _id: "subscription-1", status: "active", currentPeriodEnd: new Date("2026-05-31T00:00:00.000Z"), planId: { name: "Monthly Hero Pass" } })
    });
    mocks.scoreFind.mockReturnValue({ sort: vi.fn().mockResolvedValue([{ _id: "score-1", score: 34 }]) });
    mocks.winnerClaimFind.mockReturnValue({ sort: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ _id: "claim-1", prizeAmount: 2500 }]) }) });
    mocks.drawCycleFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          { month: "2026-04", eligibilitySnapshot: [{ userId: "user-2" }] },
          { month: "2026-03", eligibilitySnapshot: [{ userId: "user-1" }] },
          { month: "2026-02", eligibilitySnapshot: [{ userId: "user-1" }, { userId: "user-3" }] }
        ])
      })
    });

    const dashboard = await buildSubscriberDashboard("user-1");

    expect(dashboard.drawsEntered).toBe(2);
    expect(dashboard.winningsTotal).toBe(2500);
    expect(dashboard.upcomingDraw).toEqual({ month: "2026-05", eligible: true, status: "eligible" });
  });

  it("marks the upcoming draw as inactive when the subscription is not active", async () => {
    mocks.userFindById.mockReturnValue({
      populate: vi.fn().mockResolvedValue({ _id: "user-1", fullName: "Subscriber One", selectedCharityId: null, charityPercentage: 10 })
    });
    mocks.subscriptionFindOne.mockReturnValue({
      populate: vi.fn().mockResolvedValue({ _id: "subscription-1", status: "cancelled", currentPeriodEnd: new Date("2026-04-10T00:00:00.000Z"), planId: { name: "Monthly Hero Pass" } })
    });
    mocks.scoreFind.mockReturnValue({ sort: vi.fn().mockResolvedValue([]) });
    mocks.winnerClaimFind.mockReturnValue({ sort: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) });
    mocks.drawCycleFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ month: "2026-03", eligibilitySnapshot: [{ userId: "user-1" }] }])
      })
    });

    const dashboard = await buildSubscriberDashboard("user-1");

    expect(dashboard.drawsEntered).toBe(1);
    expect(dashboard.upcomingDraw).toEqual({ month: "2026-04", eligible: false, status: "inactive" });
  });

  it("rejects direct proof URLs outside demo mode", async () => {
    mocks.winnerClaimFindById.mockResolvedValue({
      _id: "claim-1",
      userId: { toString: () => "user-1" },
      reviewStatus: "pending",
      save: vi.fn()
    });

    await expect(submitWinnerProof("claim-1", {
      proofUrl: "https://example.com/proof.png",
      notes: "scorecard"
    }, "user-1")).rejects.toMatchObject({
      statusCode: 400,
      code: "WINNER_PROOF_UPLOAD_REQUIRED"
    });
  });

  it("rejects duplicate proof submission once a proof already exists", async () => {
    mocks.getEnv.mockReturnValue({ APP_ENV: "demo" });
    mocks.winnerClaimFindById.mockResolvedValue({
      _id: "claim-1",
      userId: { toString: () => "user-1" },
      reviewStatus: "pending",
      proofUrl: "https://res.cloudinary.com/demo/image/upload/proof.png",
      save: vi.fn()
    });

    await expect(submitWinnerProof("claim-1", {
      proofUrl: "https://res.cloudinary.com/demo/image/upload/proof-2.png",
      notes: "updated"
    }, "user-1")).rejects.toMatchObject({
      statusCode: 409,
      code: "WINNER_PROOF_ALREADY_SUBMITTED"
    });
  });

  it("allows direct proof URLs in demo mode", async () => {
    const save = vi.fn();
    mocks.getEnv.mockReturnValue({ APP_ENV: "demo" });
    mocks.winnerClaimFindById.mockResolvedValue({
      _id: "claim-1",
      userId: { toString: () => "user-1" },
      reviewStatus: "pending",
      save
    });

    const claim = await submitWinnerProof("claim-1", {
      proofUrl: "https://example.com/proof.png",
      notes: "scorecard"
    }, "user-1");

    expect(claim.proofUrl).toBe("https://example.com/proof.png");
    expect(save).toHaveBeenCalledOnce();
  });
});
