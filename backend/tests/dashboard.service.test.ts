import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userCountDocuments: vi.fn(),
  userAggregate: vi.fn(),
  subscriptionCountDocuments: vi.fn(),
  charityCountDocuments: vi.fn(),
  prizeAllocationAggregate: vi.fn(),
  donationAllocationAggregate: vi.fn(),
  drawCycleCountDocuments: vi.fn(),
  drawCycleFindOne: vi.fn(),
  winnerClaimAggregate: vi.fn(),
  payoutRecordAggregate: vi.fn(),
  notificationLogAggregate: vi.fn()
}));

vi.mock("../src/models", () => ({
  User: {
    countDocuments: mocks.userCountDocuments,
    aggregate: mocks.userAggregate,
    find: vi.fn()
  },
  Subscription: { countDocuments: mocks.subscriptionCountDocuments },
  Charity: { countDocuments: mocks.charityCountDocuments },
  PrizeAllocation: { aggregate: mocks.prizeAllocationAggregate },
  DonationAllocation: { aggregate: mocks.donationAllocationAggregate },
  DrawCycle: {
    countDocuments: mocks.drawCycleCountDocuments,
    findOne: mocks.drawCycleFindOne
  },
  WinnerClaim: { aggregate: mocks.winnerClaimAggregate },
  PayoutRecord: { aggregate: mocks.payoutRecordAggregate },
  NotificationLog: { aggregate: mocks.notificationLogAggregate }
}));

import { buildAdminDashboard } from "../src/services/dashboard.service";

describe("dashboard.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userCountDocuments.mockResolvedValue(120);
    mocks.subscriptionCountDocuments.mockImplementation(async (query?: { status?: unknown }) => (query?.status === "active" ? 83 : 37));
    mocks.charityCountDocuments.mockResolvedValue(11);
    mocks.prizeAllocationAggregate.mockResolvedValue([{ total: 845000 }]);
    mocks.donationAllocationAggregate.mockResolvedValue([
      { _id: "subscription", total: 215000 },
      { _id: "independent", total: 38000 }
    ]);
    mocks.drawCycleCountDocuments.mockResolvedValue(9);
    mocks.winnerClaimAggregate.mockResolvedValue([
      { _id: "pending", count: 2 },
      { _id: "approved", count: 6 },
      { _id: "rejected", count: 1 }
    ]);
    mocks.payoutRecordAggregate.mockResolvedValue([{ total: 174000, count: 5 }]);
    mocks.notificationLogAggregate.mockResolvedValue([
      { _id: "sent", count: 22 },
      { _id: "failed", count: 1 },
      { _id: "queued", count: 3 },
      { _id: "skipped", count: 4 }
    ]);
    mocks.userAggregate.mockResolvedValue([{ avg: 16.4 }]);
    mocks.drawCycleFindOne.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          month: "2026-03",
          officialNumbers: [3, 8, 14, 21, 33],
          rolloverAmount: 12000,
          publishedAt: new Date("2026-03-20T10:30:00.000Z")
        })
      })
    });
  });

  it("builds an analytics payload from the ledger and draw collections", async () => {
    const dashboard = await buildAdminDashboard();

    expect(dashboard).toMatchObject({
      totalUsers: 120,
      activeSubscriptions: 83,
      inactiveSubscriptions: 37,
      charities: 11,
      totalPrizePool: 845000,
      charityContributionTotals: 253000,
      subscriptionDonationTotals: 215000,
      independentDonationTotals: 38000,
      publishedDraws: 9,
      pendingWinnerClaims: 2,
      approvedWinnerClaims: 6,
      rejectedWinnerClaims: 1,
      totalPayouts: 174000,
      paidWinnerClaims: 5,
      avgCharityPercentage: 16.4,
      notificationStats: {
        sent: 22,
        failed: 1,
        queued: 3,
        skipped: 4
      },
      latestPublishedDraw: {
        month: "2026-03",
        officialNumbers: [3, 8, 14, 21, 33],
        rolloverAmount: 12000
      }
    });
  });
});
