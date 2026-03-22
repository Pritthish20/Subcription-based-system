import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { OneTimeDonationInput } from "@shared/index";
import { Button } from "../../../components/Button";
import { Panel } from "../../../components/Panel";
import { EmptyState } from "../../../components/ui/EmptyState";
import { currency } from "../../../lib";
import type { Charity } from "../../../lib/types/app";
import type { DashboardClaim } from "../types";

export function DonationWinningsSection({ charities, donationForm, onSubmitDonation, hasActiveSubscription, claims }: { charities: Charity[]; donationForm: UseFormReturn<OneTimeDonationInput>; onSubmitDonation: FormEventHandler<HTMLFormElement>; hasActiveSubscription: boolean; claims: DashboardClaim[] }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <form className="surface-panel space-y-4 p-6" onSubmit={onSubmitDonation}>
        <div>
          <h2 className="text-2xl font-bold text-brand-ink">Independent donation</h2>
          <p className="mt-1 text-sm muted-copy">Make a charity contribution outside your draw participation through Razorpay Checkout.</p>
        </div>
        <label className="grid gap-2 text-sm muted-copy">
          Charity
          <select {...donationForm.register("charityId")} disabled={!hasActiveSubscription}>
            <option value="">Choose charity</option>
            {charities.map((charity) => <option key={charity._id} value={charity._id}>{charity.name}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm muted-copy">
          Amount (INR)
          <input type="number" min={1} {...donationForm.register("amount", { valueAsNumber: true })} disabled={!hasActiveSubscription} />
        </label>
        <label className="grid gap-2 text-sm muted-copy">
          Message
          <textarea className="min-h-24" {...donationForm.register("message")} disabled={!hasActiveSubscription} />
        </label>
        <Button type="submit" disabled={!hasActiveSubscription}>Continue to donation</Button>
      </form>

      <Panel className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-ink">Winnings overview</h2>
          <p className="mt-1 text-sm muted-copy">Track claim review status, payout progress, and proof requirements.</p>
        </div>
        {claims.length ? (
          <ul className="space-y-3 text-sm muted-copy">
            {claims.map((claim) => (
              <li key={claim._id} className="theme-card rounded-2xl px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold capitalize text-brand-ink">{claim.tier}-match</p>
                    <p className="muted-copy">Prize {currency(claim.prizeAmount ?? 0)}</p>
                  </div>
                  <div className="text-right text-xs uppercase tracking-[0.16em] muted-copy">
                    <p>{claim.reviewStatus}</p>
                    <p>{claim.payoutStatus}</p>
                  </div>
                </div>
                {claim.proofUrl ? <a className="mt-3 inline-block text-brand-emerald underline" href={claim.proofUrl} target="_blank" rel="noreferrer">Open submitted proof</a> : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No winnings yet" message="When you place in a published draw, your claim and payout state will appear here." />
        )}
      </Panel>
    </section>
  );
}
