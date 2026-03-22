import { Button, SecondaryButton } from "../../../components/Button";
import { Panel } from "../../../components/Panel";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { currency } from "../../../lib";
import type { WinnerClaim } from "../types";
import { InfoPill } from "./InfoPill";

export function WinnerQueueSection({ winnerClaims, winnerClaimsError, onRetry, reviewNotesById, setReviewNotesById, payoutReferenceById, setPayoutReferenceById, onReviewClaim, onMarkPaid, reviewingClaimId, payingClaimId }: { winnerClaims: WinnerClaim[]; winnerClaimsError: string | null; onRetry: () => void; reviewNotesById: Record<string, string>; setReviewNotesById: React.Dispatch<React.SetStateAction<Record<string, string>>>; payoutReferenceById: Record<string, string>; setPayoutReferenceById: React.Dispatch<React.SetStateAction<Record<string, string>>>; onReviewClaim: (claimId: string, status: "approved" | "rejected") => void; onMarkPaid: (claimId: string) => void; reviewingClaimId: string | null; payingClaimId: string | null }) {
  return (
    <Panel className="space-y-4">
      <h2 className="text-2xl font-bold text-brand-ink">Winner verification queue</h2>
      {winnerClaimsError && !winnerClaims.length ? <ErrorState message={winnerClaimsError} onRetry={onRetry} /> : null}
      {winnerClaims.length ? (
        <ul className="space-y-4 text-sm muted-copy">
          {winnerClaims.map((claim) => (
            <li key={claim._id} className="theme-card space-y-4 rounded-2xl px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-brand-ink">{claim.userId?.fullName ?? "Unknown winner"}</span>
                    <InfoPill>{claim.tier}-match</InfoPill>
                  </div>
                  <p>{claim.userId?.email ?? "No email"}</p>
                  <p>Draw {claim.drawCycleId?.month ?? "Unknown"} - Prize {currency(claim.prizeAmount ?? 0)}</p>
                  <p>Review: {claim.reviewStatus} - Payout: {claim.payoutStatus}</p>
                  {claim.proofUrl ? <a className="text-brand-emerald underline" href={claim.proofUrl} target="_blank" rel="noreferrer">Open proof</a> : <p className="text-amber-700">Proof not uploaded yet</p>}
                </div>
                {claim.drawCycleId?.officialNumbers?.length ? <div className="rounded-2xl bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Numbers: {claim.drawCycleId.officialNumbers.join(", ")}</div> : null}
              </div>

              <label className="grid gap-2 text-sm muted-copy">
                Admin notes
                <textarea className="min-h-24" value={reviewNotesById[claim._id] ?? claim.adminNotes ?? ""} onChange={(event) => setReviewNotesById((current) => ({ ...current, [claim._id]: event.target.value }))} />
              </label>

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={() => onReviewClaim(claim._id, "approved")} disabled={reviewingClaimId === claim._id}>{reviewingClaimId === claim._id ? "Saving..." : "Approve"}</Button>
                <SecondaryButton type="button" onClick={() => onReviewClaim(claim._id, "rejected")} disabled={reviewingClaimId === claim._id}>{reviewingClaimId === claim._id ? "Saving..." : "Reject"}</SecondaryButton>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <label className="grid gap-2 text-sm muted-copy">
                  Payout reference
                  <input value={payoutReferenceById[claim._id] ?? ""} onChange={(event) => setPayoutReferenceById((current) => ({ ...current, [claim._id]: event.target.value }))} placeholder="UTR / bank reference / transfer id" />
                </label>
                <Button type="button" className="self-end" onClick={() => onMarkPaid(claim._id)} disabled={claim.reviewStatus !== "approved" || claim.payoutStatus === "paid" || payingClaimId === claim._id}>{claim.payoutStatus === "paid" ? "Paid" : payingClaimId === claim._id ? "Marking..." : "Mark paid"}</Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No winner claims yet" message="Published draws with winners will appear here for proof review and payout handling." />
      )}
    </Panel>
  );
}
