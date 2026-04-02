import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { WinnerProofInput } from "@shared/index";
import { Button } from "../../../components/Button";
import { MetricCard } from "../../../components/MetricCard";
import { Panel } from "../../../components/Panel";
import type { DashboardClaim, DashboardScore } from "../types";
import { currency } from "../../../lib";

export function ProofParticipationSection({ proofForm, onSubmitProof, pendingClaims, selectedClaimId, setSelectedClaimId, setProofFile, hasProofFile, uploadState, scores, hasActiveSubscription }: { proofForm: UseFormReturn<WinnerProofInput>; onSubmitProof: FormEventHandler<HTMLFormElement>; pendingClaims: DashboardClaim[]; selectedClaimId: string; setSelectedClaimId: (value: string) => void; setProofFile: (value: File | null) => void; hasProofFile: boolean; uploadState: "idle" | "uploading"; scores: DashboardScore[]; hasActiveSubscription: boolean }) {
  const selectedClaim = pendingClaims.find((claim) => claim._id === selectedClaimId) ?? pendingClaims[0] ?? null;
  const proofAlreadySubmitted = Boolean(selectedClaim?.proofUrl);
  const canSubmitProof = Boolean(selectedClaim) && !proofAlreadySubmitted && hasProofFile && uploadState !== "uploading";
  const submitLabel = uploadState === "uploading"
    ? "Uploading proof..."
    : !selectedClaim
      ? "No pending claim"
      : proofAlreadySubmitted
        ? "Proof submitted"
        : hasProofFile
          ? "Submit proof"
          : "Select proof file";

  return (
    <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <form className="surface-panel space-y-4 p-6" onSubmit={onSubmitProof}>
        <div>
          <h2 className="text-2xl font-bold text-brand-ink">Winner proof upload</h2>
          <p className="mt-1 text-sm muted-copy">Upload score evidence for any pending claim that still needs admin review.</p>
        </div>
        <label className="grid gap-2 text-sm muted-copy">
          Pending claim
          <select value={selectedClaimId} onChange={(event) => setSelectedClaimId(event.target.value)}>
            <option value="">Use latest pending claim</option>
            {pendingClaims.map((claim) => <option key={claim._id} value={claim._id}>{claim.tier}-match · {currency(claim.prizeAmount ?? 0)}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm muted-copy">
          Upload screenshot
          <input type="file" accept="image/*" onChange={(event) => setProofFile(event.target.files?.[0] ?? null)} disabled={proofAlreadySubmitted || uploadState === "uploading"} />
        </label>
        <label className="grid gap-2 text-sm muted-copy">
          Notes
          <textarea className="min-h-24" {...proofForm.register("notes")} placeholder="Add any notes for the admin review team" />
        </label>
        <div className="space-y-3">
          <Button type="submit" size="lg" className="min-w-[12rem] shadow-[0_20px_40px_rgba(27,42,31,0.22)]" disabled={!canSubmitProof}>{submitLabel}</Button>
          {!selectedClaim ? <p className="rounded-2xl border border-brand-gold/22 bg-brand-gold/10 px-4 py-3 text-sm font-medium text-brand-night/72 dark:border-brand-gold/18 dark:bg-brand-gold/12 dark:text-[#efe2cf]/84">Proof submission unlocks only when you have a pending winner claim to review.</p> : null}
          {selectedClaim && proofAlreadySubmitted ? <p className="rounded-2xl border border-brand-emerald/24 bg-brand-emerald/12 px-4 py-3 text-sm font-medium text-brand-night/78 dark:border-brand-emerald/20 dark:bg-brand-emerald/14 dark:text-[#efe2cf]/88">Proof has already been submitted for this claim. It is now waiting for admin review.</p> : null}
          {selectedClaim && !proofAlreadySubmitted && !hasProofFile ? <p className="rounded-2xl border border-brand-night/10 bg-brand-night/5 px-4 py-3 text-sm font-medium text-brand-night/72 dark:border-[#304232] dark:bg-[#172319] dark:text-[#efe2cf]/82">Choose an image file first, then submit it for the selected claim.</p> : null}
        </div>
      </form>

      <Panel className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-ink">Participation snapshot</h2>
          <p className="mt-1 text-sm muted-copy">See how ready you are for the next draw and what still needs action.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricCard value={scores.length} label="Scores stored" />
          <MetricCard value={pendingClaims.length} label="Claims pending" />
        </div>
        <div className="surface-soft p-4 text-sm muted-copy">
          <p>Draw readiness: {hasActiveSubscription && scores.length >= 5 ? "Ready" : "Action needed"}</p>
          <p className="mt-2">Next action: {!hasActiveSubscription ? "Activate your subscription" : scores.length < 5 ? "Add more score history" : pendingClaims.length ? proofAlreadySubmitted ? "Wait for admin review on your submitted proof" : "Submit proof for your pending claim" : "Wait for the next published draw"}</p>
        </div>
      </Panel>
    </section>
  );
}
