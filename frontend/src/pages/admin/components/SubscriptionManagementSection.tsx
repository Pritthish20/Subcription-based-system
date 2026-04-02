import { useMemo, useState } from "react";
import { Button, GhostButton, SecondaryButton } from "../../../components/Button";
import { Panel } from "../../../components/Panel";
import { DetailModal } from "../../../components/ui/DetailModal";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { currency } from "../../../lib";
import type { AdminSubscription, SubscriptionDraft } from "../types";
import { InfoPill } from "./InfoPill";

const PREVIEW_COUNT = 3;

const subscriptionCardClass = (selected: boolean) => `w-full rounded-2xl border px-4 py-4 text-left transition ${selected ? "border-[#d8ba82] bg-[#f5eadc] shadow-[0_16px_32px_rgba(15,18,15,0.14)] dark:border-[#d8ba82] dark:bg-[#efe4d6]" : "border-[#decfbc] bg-[#efe7dc] hover:border-[#d6b98a] hover:bg-[#f7eee2] dark:border-[#d6c4ad] dark:bg-[#e8dfd2] dark:hover:border-[#d8ba82] dark:hover:bg-[#f2e8dc]"}`;

export function SubscriptionManagementSection({ subscriptions, subscriptionsError, onRetry, selectedSubscriptionId, subscriptionDraft, setSubscriptionDraft, onSelectSubscription, onSaveSubscription, onClearSelection, savingSubscriptionId }: { subscriptions: AdminSubscription[]; subscriptionsError: string | null; onRetry: () => void; selectedSubscriptionId: string | null; subscriptionDraft: SubscriptionDraft | null; setSubscriptionDraft: React.Dispatch<React.SetStateAction<SubscriptionDraft | null>>; onSelectSubscription: (subscription: AdminSubscription) => void; onSaveSubscription: () => void; onClearSelection: () => void; savingSubscriptionId: string | null }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const previewSubscriptions = useMemo(() => subscriptions.slice(0, PREVIEW_COUNT), [subscriptions]);
  const selectedSubscription = useMemo(() => subscriptions.find((entry) => entry._id === selectedSubscriptionId) ?? null, [subscriptions, selectedSubscriptionId]);

  function openWithSelection(subscription?: AdminSubscription) {
    if (subscription) onSelectSubscription(subscription);
    setIsModalOpen(true);
  }

  return (
    <>
      <Panel className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-brand-ink">Subscription management</h2>
            <p className="mt-1 text-sm muted-copy">Show only the newest billing records here, then open the full ledger when you need to fix lifecycle or renewal details.</p>
          </div>
          {subscriptions.length ? <SecondaryButton type="button" size="sm" onClick={() => openWithSelection()}>Open full list</SecondaryButton> : null}
        </div>
        {subscriptionsError && !subscriptions.length ? <ErrorState message={subscriptionsError} onRetry={onRetry} /> : null}
        {selectedSubscription ? (
          <div className="rounded-2xl border border-[#314432] bg-[#162118] px-4 py-3 text-sm text-[#f5eadc] shadow-[0_16px_35px_rgba(8,12,8,0.18)]">
            <span className="font-semibold">Current selection:</span> {selectedSubscription.userId?.fullName ?? "Unknown user"} / {selectedSubscription.planId?.name ?? "Unknown plan"}
          </div>
        ) : null}
        <div className="space-y-3">
          {previewSubscriptions.length ? previewSubscriptions.map((subscription) => (
            <button key={subscription._id} type="button" onClick={() => openWithSelection(subscription)} className={subscriptionCardClass(selectedSubscriptionId === subscription._id)}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#2b241d]">{subscription.userId?.fullName ?? "Unknown user"}</span>
                <InfoPill>{subscription.status}</InfoPill>
              </div>
              <p className="mt-1 text-sm text-[#8b7762]">{subscription.userId?.email ?? "No email"}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#b59f86]">{subscription.planId?.name ?? "Unknown plan"} - {currency(subscription.planId?.amountInr ?? 0)}</p>
            </button>
          )) : <EmptyState title="No subscriptions yet" message="Subscriber billing records will appear here once plans are activated." />}
        </div>
        {subscriptions.length > PREVIEW_COUNT ? <p className="text-sm muted-copy">Showing the latest {PREVIEW_COUNT} subscriptions here. Open the full list for lifecycle edits and billing review.</p> : null}
      </Panel>

      <DetailModal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Subscription management" description="Review the complete subscription ledger and update renewal or cancellation details without stretching the admin dashboard.">
        {subscriptionsError && !subscriptions.length ? <ErrorState message={subscriptionsError} onRetry={onRetry} /> : null}
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-3">
            {subscriptions.length ? subscriptions.map((subscription) => (
              <button key={subscription._id} type="button" onClick={() => onSelectSubscription(subscription)} className={subscriptionCardClass(selectedSubscriptionId === subscription._id)}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#2b241d]">{subscription.userId?.fullName ?? "Unknown user"}</span>
                  <InfoPill>{subscription.status}</InfoPill>
                </div>
                <p className="mt-1 text-sm text-[#8b7762]">{subscription.userId?.email ?? "No email"}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#b59f86]">{subscription.planId?.name ?? "Unknown plan"} - {currency(subscription.planId?.amountInr ?? 0)}</p>
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
      </DetailModal>
    </>
  );
}
