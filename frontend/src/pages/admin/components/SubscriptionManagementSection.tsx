import { Button, GhostButton } from "../../../components/Button";
import { Panel } from "../../../components/Panel";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { currency } from "../../../lib";
import type { AdminSubscription, SubscriptionDraft } from "../types";
import { InfoPill } from "./InfoPill";

export function SubscriptionManagementSection({ subscriptions, subscriptionsError, onRetry, selectedSubscriptionId, subscriptionDraft, setSubscriptionDraft, onSelectSubscription, onSaveSubscription, onClearSelection, savingSubscriptionId }: { subscriptions: AdminSubscription[]; subscriptionsError: string | null; onRetry: () => void; selectedSubscriptionId: string | null; subscriptionDraft: SubscriptionDraft | null; setSubscriptionDraft: React.Dispatch<React.SetStateAction<SubscriptionDraft | null>>; onSelectSubscription: (subscription: AdminSubscription) => void; onSaveSubscription: () => void; onClearSelection: () => void; savingSubscriptionId: string | null }) {
  return (
    <Panel className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-ink">Subscription management</h2>
        <p className="mt-1 text-sm muted-copy">Review billing status, period end, and cancellation context.</p>
      </div>
      {subscriptionsError && !subscriptions.length ? <ErrorState message={subscriptionsError} onRetry={onRetry} /> : null}
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          {subscriptions.length ? subscriptions.slice(0, 12).map((subscription) => (
            <button key={subscription._id} type="button" onClick={() => onSelectSubscription(subscription)} className={`w-full rounded-2xl border px-4 py-4 text-left transition ${selectedSubscriptionId === subscription._id ? "border-brand-emerald/36 bg-brand-emerald/12" : "border-[#eadbc8]/80 bg-[#fff8ef]/56 hover:bg-[#fffdf8]"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-brand-ink">{subscription.userId?.fullName ?? "Unknown user"}</span>
                <InfoPill>{subscription.status}</InfoPill>
              </div>
              <p className="mt-1 text-sm muted-copy">{subscription.userId?.email ?? "No email"}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] muted-copy">{subscription.planId?.name ?? "Unknown plan"} - {currency(subscription.planId?.amountInr ?? 0)}</p>
            </button>
          )) : <EmptyState title="No subscriptions yet" message="Subscriber billing records will appear here once plans are activated." />}
        </div>

        <div className="surface-soft p-5">
          {subscriptionDraft ? (
            <div className="space-y-4">
              <label className="grid gap-2 text-sm muted-copy">Status<select value={subscriptionDraft.status} onChange={(event) => setSubscriptionDraft((current) => current ? { ...current, status: event.target.value as SubscriptionDraft["status"] } : current)}><option value="incomplete">Incomplete</option><option value="active">Active</option><option value="past_due">Past due</option><option value="cancelled">Cancelled</option><option value="lapsed">Lapsed</option></select></label>
              <label className="grid gap-2 text-sm muted-copy">Current period end<input type="datetime-local" value={subscriptionDraft.currentPeriodEnd} onChange={(event) => setSubscriptionDraft((current) => current ? { ...current, currentPeriodEnd: event.target.value } : current)} /></label>
              <label className="grid gap-2 text-sm muted-copy">Cancellation reason<textarea className="min-h-28" value={subscriptionDraft.cancellationReason} onChange={(event) => setSubscriptionDraft((current) => current ? { ...current, cancellationReason: event.target.value } : current)} /></label>
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={onSaveSubscription} disabled={savingSubscriptionId === selectedSubscriptionId}>{savingSubscriptionId === selectedSubscriptionId ? "Saving..." : "Save subscription"}</Button>
                <GhostButton type="button" onClick={onClearSelection}>Clear selection</GhostButton>
              </div>
            </div>
          ) : (
            <EmptyState title="Select a subscription" message="Choose a subscription record to adjust lifecycle state or billing dates." />
          )}
        </div>
      </div>
    </Panel>
  );
}
