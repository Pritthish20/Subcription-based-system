import { useMemo, useState } from "react";
import { Button, DangerButton, SecondaryButton } from "../../../components/Button";
import { Panel } from "../../../components/Panel";
import { DetailModal } from "../../../components/ui/DetailModal";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { currency } from "../../../lib";
import type { WinnerClaim } from "../types";
import { InfoPill } from "./InfoPill";

const PREVIEW_COUNT = 3;

function WinnerClaimCard({
  claim,
  reviewNotesById,
  setReviewNotesById,
  payoutReferenceById,
  setPayoutReferenceById,
  onReviewClaim,
  onMarkPaid,
  reviewingClaimId,
  payingClaimId
}: {
  claim: WinnerClaim;
  reviewNotesById: Record<string, string>;
  setReviewNotesById: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  payoutReferenceById: Record<string, string>;
  setPayoutReferenceById: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onReviewClaim: (claimId: string, status: "approved" | "rejected") => void;
  onMarkPaid: (claimId: string) => void;
  reviewingClaimId: string | null;
  payingClaimId: string | null;
}) {
  const reviewLocked = claim.reviewStatus !== "pending";
  const approveLabel = claim.reviewStatus === "approved" ? "Approved" : reviewingClaimId === claim._id ? "Saving..." : "Approve";
  const rejectLabel = claim.reviewStatus === "rejected" ? "Rejected" : reviewingClaimId === claim._id ? "Saving..." : "Reject";
  const payoutDisabled = claim.reviewStatus !== "approved" || claim.payoutStatus === "paid" || payingClaimId === claim._id;

  return (
    <li className="theme-card space-y-4 rounded-2xl px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-brand-ink">{claim.userId?.fullName ?? "Unknown winner"}</span>
            <InfoPill>{claim.tier}-match</InfoPill>
          </div>
          <p>{claim.userId?.email ?? "No email"}</p>
          <p>Draw {claim.drawCycleId?.month ?? "Unknown"} - Prize {currency(claim.prizeAmount ?? 0)}</p>
          <p>Review: {claim.reviewStatus} - Payout: {claim.payoutStatus}</p>
          {claim.proofUrl ? <a className="text-brand-emerald underline underline-offset-2" href={claim.proofUrl} target="_blank" rel="noreferrer">Open proof</a> : <p className="font-medium text-[#b87d2d]">Proof not uploaded yet</p>}
        </div>
        {claim.drawCycleId?.officialNumbers?.length ? <div className="rounded-2xl border border-[#d9c8b2] bg-[#fff8ef] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b6a58] shadow-sm">Numbers: {claim.drawCycleId.officialNumbers.join(", ")}</div> : null}
      </div>

      <label className="grid gap-2 text-sm muted-copy">
        Admin notes
        <textarea className="min-h-24" value={reviewNotesById[claim._id] ?? claim.adminNotes ?? ""} onChange={(event) => setReviewNotesById((current) => ({ ...current, [claim._id]: event.target.value }))} />
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => onReviewClaim(claim._id, "approved")} disabled={reviewLocked || reviewingClaimId === claim._id} className={claim.reviewStatus === "approved" ? "min-w-[9rem] border-[#7a9a74] bg-[#7a9a74] text-[#112014]" : "min-w-[9rem]"}>{approveLabel}</Button>
        <DangerButton type="button" onClick={() => onReviewClaim(claim._id, "rejected")} disabled={reviewLocked || reviewingClaimId === claim._id} className={claim.reviewStatus === "rejected" ? "min-w-[9rem] border-[#c37e67] bg-[#c37e67]/28 text-[#8b4a38]" : "min-w-[9rem]"}>{rejectLabel}</DangerButton>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="grid gap-2 text-sm muted-copy">
          Payout reference
          <input value={payoutReferenceById[claim._id] ?? ""} onChange={(event) => setPayoutReferenceById((current) => ({ ...current, [claim._id]: event.target.value }))} placeholder="UTR / bank reference / transfer id" />
        </label>
        <SecondaryButton type="button" size="sm" className="self-end min-w-[8.5rem]" onClick={() => onMarkPaid(claim._id)} disabled={payoutDisabled}>{claim.payoutStatus === "paid" ? "Paid" : payingClaimId === claim._id ? "Marking..." : "Mark paid"}</SecondaryButton>
      </div>
    </li>
  );
}

export function WinnerQueueSection({ winnerClaims, winnerClaimsError, onRetry, reviewNotesById, setReviewNotesById, payoutReferenceById, setPayoutReferenceById, onReviewClaim, onMarkPaid, reviewingClaimId, payingClaimId }: { winnerClaims: WinnerClaim[]; winnerClaimsError: string | null; onRetry: () => void; reviewNotesById: Record<string, string>; setReviewNotesById: React.Dispatch<React.SetStateAction<Record<string, string>>>; payoutReferenceById: Record<string, string>; setPayoutReferenceById: React.Dispatch<React.SetStateAction<Record<string, string>>>; onReviewClaim: (claimId: string, status: "approved" | "rejected") => void; onMarkPaid: (claimId: string) => void; reviewingClaimId: string | null; payingClaimId: string | null }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const previewClaims = useMemo(() => winnerClaims.slice(0, PREVIEW_COUNT), [winnerClaims]);

  return (
    <>
      <Panel className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-brand-ink">Winner verification queue</h2>
            <p className="mt-1 text-sm muted-copy">Keep only the latest claims on the dashboard, then open the full queue when you need to review proof and payouts in depth.</p>
          </div>
          {winnerClaims.length ? <SecondaryButton type="button" size="sm" className="border-[#94b08f] bg-[#6e8f6a]/34 text-[#f8f3e8]" onClick={() => setIsModalOpen(true)}>View full list</SecondaryButton> : null}
        </div>
        {winnerClaimsError && !winnerClaims.length ? <ErrorState message={winnerClaimsError} onRetry={onRetry} /> : null}
        {previewClaims.length ? (
          <ul className="space-y-4 text-sm muted-copy">
            {previewClaims.map((claim) => (
              <WinnerClaimCard
                key={claim._id}
                claim={claim}
                reviewNotesById={reviewNotesById}
                setReviewNotesById={setReviewNotesById}
                payoutReferenceById={payoutReferenceById}
                setPayoutReferenceById={setPayoutReferenceById}
                onReviewClaim={onReviewClaim}
                onMarkPaid={onMarkPaid}
                reviewingClaimId={reviewingClaimId}
                payingClaimId={payingClaimId}
              />
            ))}
          </ul>
        ) : (
          <EmptyState title="No winner claims yet" message="Published draws with winners will appear here for proof review and payout handling." />
        )}
        {winnerClaims.length > PREVIEW_COUNT ? <p className="text-sm muted-copy">Showing the latest {PREVIEW_COUNT} claims here. Open the full queue for the full review and payout workflow.</p> : null}
      </Panel>

      <DetailModal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Winner verification queue" description="Review every claim, approve or reject evidence, and complete payout handling without stretching the main admin page.">
        {winnerClaimsError && !winnerClaims.length ? <ErrorState message={winnerClaimsError} onRetry={onRetry} /> : null}
        {winnerClaims.length ? (
          <ul className="space-y-4 text-sm muted-copy">
            {winnerClaims.map((claim) => (
              <WinnerClaimCard
                key={claim._id}
                claim={claim}
                reviewNotesById={reviewNotesById}
                setReviewNotesById={setReviewNotesById}
                payoutReferenceById={payoutReferenceById}
                setPayoutReferenceById={setPayoutReferenceById}
                onReviewClaim={onReviewClaim}
                onMarkPaid={onMarkPaid}
                reviewingClaimId={reviewingClaimId}
                payingClaimId={payingClaimId}
              />
            ))}
          </ul>
        ) : (
          <EmptyState title="No winner claims yet" message="Published draws with winners will appear here for proof review and payout handling." />
        )}
      </DetailModal>
    </>
  );
}
