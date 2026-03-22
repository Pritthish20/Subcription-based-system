import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  subscriptionFind: vi.fn(),
  drawCycleFindOne: vi.fn(),
  drawCycleFindOneAndUpdate: vi.fn(),
  userFind: vi.fn(),
  scoreFind: vi.fn(),
  winnerDeleteMany: vi.fn(),
  winnerInsertMany: vi.fn(),
  prizeFindOneAndUpdate: vi.fn(),
  notifyMany: vi.fn(),
  recordAdminAction: vi.fn(),
  getMonthWindow: vi.fn(() => ({ end: new Date("2026-04-01T00:00:00.000Z") })),
  getRandomNumbers: vi.fn(() => [1, 2, 3, 4, 5]),
  countMatches: vi.fn((scores: number[], numbers: number[]) => scores.filter((score) => numbers.includes(score)).length),
  uniqueSortedNumbers: vi.fn((numbers: number[]) => [...numbers].sort((a, b) => a - b)),
  weightedNumbers: vi.fn(() => [9, 8, 7, 6, 5])
}));

vi.mock("../src/models", () => ({
  Subscription: { find: mocks.subscriptionFind },
  DrawCycle: { findOne: mocks.drawCycleFindOne, findOneAndUpdate: mocks.drawCycleFindOneAndUpdate },
  User: { find: mocks.userFind },
  ScoreEntry: { find: mocks.scoreFind },
  WinnerClaim: { deleteMany: mocks.winnerDeleteMany, insertMany: mocks.winnerInsertMany },
  PrizeAllocation: { findOneAndUpdate: mocks.prizeFindOneAndUpdate },
  DrawSimulation: { create: vi.fn() }
}));

vi.mock("../src/utils", () => ({
  getMonthWindow: mocks.getMonthWindow,
  getRandomNumbers: mocks.getRandomNumbers,
  countMatches: mocks.countMatches,
  uniqueSortedNumbers: mocks.uniqueSortedNumbers,
  weightedNumbers: mocks.weightedNumbers
}));

vi.mock("../src/services/notification.service", () => ({
  notifyMany: mocks.notifyMany
}));

vi.mock("../src/services/audit.service", () => ({
  recordAdminAction: mocks.recordAdminAction
}));

import { publishDraw } from "../src/services/draw.service";

describe("draw publish flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("publishes a draw, creates winner claims, and notifies active subscribers", async () => {
    const drawSave = vi.fn();
    const activeSubscriptions = [
      { userId: { toString: () => "user-1" }, planId: { interval: "monthly", amountInr: 100, prizePoolContributionPercentage: 50 } },
      { userId: { toString: () => "user-2" }, planId: { interval: "monthly", amountInr: 100, prizePoolContributionPercentage: 50 } }
    ];

    mocks.subscriptionFind.mockReturnValue({ populate: vi.fn().mockResolvedValue(activeSubscriptions) });
    mocks.drawCycleFindOne.mockReturnValue({ sort: vi.fn().mockResolvedValue({ rolloverAmount: 20 }) });
    mocks.userFind.mockResolvedValue([
      { _id: { toString: () => "user-1" }, selectedCharityId: { toString: () => "charity-1" } },
      { _id: { toString: () => "user-2" }, selectedCharityId: { toString: () => "charity-2" } }
    ]);
    mocks.scoreFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([
        { userId: { toString: () => "user-1" }, score: 1 },
        { userId: { toString: () => "user-1" }, score: 2 },
        { userId: { toString: () => "user-1" }, score: 3 },
        { userId: { toString: () => "user-1" }, score: 4 },
        { userId: { toString: () => "user-1" }, score: 5 },
        { userId: { toString: () => "user-2" }, score: 1 },
        { userId: { toString: () => "user-2" }, score: 2 },
        { userId: { toString: () => "user-2" }, score: 3 },
        { userId: { toString: () => "user-2" }, score: 4 },
        { userId: { toString: () => "user-2" }, score: 9 }
      ])
    });
    mocks.drawCycleFindOneAndUpdate.mockResolvedValue({ _id: "draw-1", rolloverAmount: 20, save: drawSave });

    const result = await publishDraw({ month: "2026-03", mode: "random", numbers: [1, 2, 3, 4, 5] }, "admin-1");

    expect(mocks.uniqueSortedNumbers).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
    expect(result.winnerCounts).toEqual({ five: 1, four: 1, three: 0 });
    expect(result.splitAmounts).toEqual({ five: 60, four: 35, three: 0 });
    expect(mocks.winnerInsertMany).toHaveBeenCalledTimes(1);
    expect(mocks.prizeFindOneAndUpdate).toHaveBeenCalledWith(
      { drawCycleId: "draw-1" },
      expect.objectContaining({ totalPrizePool: 100, rolloverAmount: 0, winnerCounts: { five: 1, four: 1, three: 0 } }),
      { upsert: true, new: true }
    );
    expect(mocks.recordAdminAction).toHaveBeenCalledWith(expect.objectContaining({ adminId: "admin-1", action: "draw.published", targetId: "draw-1" }));
    expect(mocks.notifyMany).toHaveBeenCalledWith(["user-1", "user-2"], "draw.published", expect.objectContaining({ month: "2026-03" }));
  });
});
