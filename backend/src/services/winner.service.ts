import { v2 as cloudinary } from "cloudinary";
import type { PayoutUpdateInput, WinnerReviewInput } from "../../../shared/src/index";
import { ensureCloudinaryReady } from "../config";
import { ApiError, runService } from "../lib/http";
import { PayoutRecord, WinnerClaim } from "../models";
import { recordAdminAction } from "./audit.service";
import { notify } from "./notification.service";

export async function listWinnerClaims() {
  return runService("winner.service", "listWinnerClaims", async () => {
    return WinnerClaim.find()
      .populate("userId", "fullName email")
      .populate("drawCycleId", "month officialNumbers publishedAt")
      .sort({ reviewStatus: 1, payoutStatus: 1, createdAt: -1 })
      .limit(100);
  });
}

export async function reviewWinner(claimId: string, payload: WinnerReviewInput, adminId?: string) {
  return runService("winner.service", "reviewWinner", async () => {
    const claim = await WinnerClaim.findById(claimId);
    if (!claim) throw new ApiError(404, "Winner claim not found", { code: "WINNER_CLAIM_NOT_FOUND" });
    const before = claim.toObject();
    claim.reviewStatus = payload.status;
    claim.adminNotes = payload.adminNotes;
    claim.reviewedAt = new Date();
    await claim.save();
    if (adminId) {
      await recordAdminAction({
        adminId,
        action: "winner_claim.reviewed",
        targetType: "winner_claim",
        targetId: claimId,
        before,
        after: claim,
        meta: { reviewStatus: payload.status }
      });
    }
    await notify(claim.userId.toString(), `winner.${payload.status}`, { claimId });
    return claim;
  });
}

export async function markWinnerPaid(claimId: string, payload: PayoutUpdateInput, adminId: string) {
  return runService("winner.service", "markWinnerPaid", async () => {
    const claim = await WinnerClaim.findById(claimId);
    if (!claim) throw new ApiError(404, "Winner claim not found", { code: "WINNER_CLAIM_NOT_FOUND" });
    if (claim.reviewStatus !== "approved") {
      throw new ApiError(409, "Winner claim must be approved before payout", {
        code: "WINNER_CLAIM_NOT_APPROVED",
        context: { reviewStatus: claim.reviewStatus }
      });
    }
    if (claim.payoutStatus === "paid") {
      throw new ApiError(409, "Winner claim has already been paid", { code: "WINNER_CLAIM_ALREADY_PAID" });
    }
    const before = claim.toObject();
    claim.payoutStatus = "paid";
    claim.paidAt = payload.paidAt ? new Date(payload.paidAt) : new Date();
    await claim.save();
    const record = await PayoutRecord.create({ winnerClaimId: claim._id, amountInr: claim.prizeAmount, reference: payload.reference, paidAt: claim.paidAt, markedBy: adminId });
    await recordAdminAction({
      adminId,
      action: "winner_claim.paid",
      targetType: "winner_claim",
      targetId: claimId,
      before,
      after: claim,
      meta: { payoutRecordId: record._id.toString(), reference: payload.reference }
    });
    await notify(claim.userId.toString(), "winner.paid", { claimId, reference: payload.reference, paidAt: claim.paidAt?.toISOString() });
    return { claim, record };
  });
}

export async function createWinnerProofUploadSignature(userId: string) {
  return runService("winner.service", "createWinnerProofUploadSignature", async () => {
    const env = ensureCloudinaryReady();
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `golf-charity/winner-proofs/${userId}`;
    return {
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      folder,
      timestamp,
      signature: cloudinary.utils.api_sign_request({ folder, timestamp }, env.CLOUDINARY_API_SECRET!),
      uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`
    };
  });
}

