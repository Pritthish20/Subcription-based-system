import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { WinnerProofInput } from "@shared/index";
import { Button } from "../../../components/Button";
import { MetricCard } from "../../../components/MetricCard";
import { Panel } from "../../../components/Panel";
import type { DashboardClaim, DashboardScore } from "../types";
import { currency } from "../../../lib";

export function ProofParticipationSection({ proofForm, onSubmitProof, pendingClaims, selectedClaimId, setSelectedClaimId, setProofFile, uploadState, scores, hasActiveSubscription }: { proofForm: UseFormReturn<WinnerProofInput>; onSubmitProof: FormEventHandler<HTMLFormElement>; pendingClaims: DashboardClaim[]; selectedClaimId: string; setSelectedClaimId: (value: string) => void; setProofFile: (value: File | null) => void; uploadState: "idle" | "uploading"; scores: DashboardScore[]; hasActiveSubscription: boolean }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <form className="surface-panel space-y-4 p-6" onSubmit={onSubmitProof}>
        <div>
          <h2 className="text-2xl font-bold text-brand-ink">Winner proof upload</h2>
          <p className="mt-1 text-sm muted-copy">Upload score evidence for any pending claim that needs review.</p>
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
          <input type="file" accept="image/*" onChange={(event) => setProofFile(event.target.files?.[0] ?? null)} />
        </label>
        <label className="grid gap-2 text-sm muted-copy">
          Backup proof URL
          <input {...proofForm.register("proofUrl")} type="url" placeholder="Demo mode only. Production requires Cloudinary upload." />
        </label>
        <label className="grid gap-2 text-sm muted-copy">
          Notes
          <textarea className="min-h-24" {...proofForm.register("notes")} placeholder="Add any notes for the admin review team" />
        </label>
        <Button type="submit" disabled={uploadState === "uploading" || !pendingClaims.length}>{uploadState === "uploading" ? "Uploading proof..." : "Submit proof"}</Button>
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
          <p className="mt-2">Next action: {!hasActiveSubscription ? "Activate your subscription" : scores.length < 5 ? "Add more score history" : pendingClaims.length ? "Submit proof for your pending claim" : "Wait for the next published draw"}</p>
        </div>
      </Panel>
    </section>
  );
}
