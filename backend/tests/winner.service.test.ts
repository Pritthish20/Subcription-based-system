import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  winnerFindById: vi.fn(),
  payoutCreate: vi.fn(),
  notify: vi.fn(),
  ensureCloudinaryReady: vi.fn(),
  recordAdminAction: vi.fn()
}));

vi.mock("../src/models", () => ({
  WinnerClaim: { findById: mocks.winnerFindById, find: vi.fn() },
  PayoutRecord: { create: mocks.payoutCreate }
}));

vi.mock("../src/services/notification.service", () => ({
  notify: mocks.notify
}));

vi.mock("../src/services/audit.service", () => ({
  recordAdminAction: mocks.recordAdminAction
}));

vi.mock("../src/config", () => ({
  ensureCloudinaryReady: mocks.ensureCloudinaryReady
}));

import { markWinnerPaid, reviewWinner } from "../src/services/winner.service";

describe("winner service flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reviews a winner claim and notifies the winner", async () => {
    const save = vi.fn();
    mocks.winnerFindById.mockResolvedValue({ _id: "claim-1", userId: { toString: () => "user-1" }, save, toObject: () => ({ reviewStatus: "pending" }) });

    const result = await reviewWinner("claim-1", { status: "approved", adminNotes: "Verified" }, "admin-1");

    expect(result.reviewStatus).toBe("approved");
    expect(result.adminNotes).toBe("Verified");
    expect(save).toHaveBeenCalledOnce();
    expect(mocks.recordAdminAction).toHaveBeenCalledWith(expect.objectContaining({ adminId: "admin-1", action: "winner_claim.reviewed", targetId: "claim-1" }));
    expect(mocks.notify).toHaveBeenCalledWith("user-1", "winner.approved", { claimId: "claim-1" });
  });

  it("marks a winner as paid, records payout details, and notifies the winner", async () => {
    const save = vi.fn();
    mocks.winnerFindById.mockResolvedValue({ _id: "claim-1", userId: { toString: () => "user-1" }, prizeAmount: 2500, save, toObject: () => ({ payoutStatus: "pending" }) });
    mocks.payoutCreate.mockResolvedValue({ _id: "payout-1" });

    const result = await markWinnerPaid("claim-1", { reference: "UTR123", paidAt: "2026-03-21T10:00:00.000Z" }, "admin-1");

    expect(result.claim.payoutStatus).toBe("paid");
    expect(mocks.payoutCreate).toHaveBeenCalledWith(expect.objectContaining({ winnerClaimId: "claim-1", reference: "UTR123", markedBy: "admin-1" }));
    expect(mocks.recordAdminAction).toHaveBeenCalledWith(expect.objectContaining({ adminId: "admin-1", action: "winner_claim.paid", targetId: "claim-1" }));
    expect(mocks.notify).toHaveBeenCalledWith("user-1", "winner.paid", expect.objectContaining({ claimId: "claim-1", reference: "UTR123" }));
  });
});
