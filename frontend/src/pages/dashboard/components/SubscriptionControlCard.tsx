import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { CancelSubscriptionInput, CheckoutInput } from "@shared/index";
import { Button, DangerButton } from "../../../components/Button";
import { Panel } from "../../../components/Panel";
import { EmptyState } from "../../../components/ui/EmptyState";
import { currency } from "../../../lib";
import type { DashboardSummary } from "../types";
import type { Plan } from "../../../lib/types/app";

function actionBadgeLabel(hasActiveSubscription: boolean, samePlanSelected: boolean, isUpgrade: boolean) {
  if (!hasActiveSubscription) return "New";
  if (samePlanSelected) return "Current";
  if (isUpgrade) return "Upgrade";
  return "Switch";
}

export function SubscriptionControlCard({ plans, plansLoading, plansError, checkoutForm, cancelForm, onCheckout, onCancel, summary, subscriptionStatus, checkoutDisabled }: { plans: Plan[]; plansLoading: boolean; plansError: string | null; checkoutForm: UseFormReturn<CheckoutInput>; cancelForm: UseFormReturn<CancelSubscriptionInput>; onCheckout: FormEventHandler<HTMLFormElement>; onCancel: FormEventHandler<HTMLFormElement>; summary: DashboardSummary | null; subscriptionStatus: string; checkoutDisabled: boolean }) {
  const currentPlan = summary?.subscription?.planId;
  const currentPlanId = currentPlan?._id;
  const selectedPlanId = checkoutForm.watch("planId");
  const selectedPlan = plans.find((plan) => plan._id === selectedPlanId) ?? null;
  const hasActiveSubscription = subscriptionStatus === "active";
  const samePlanSelected = Boolean(hasActiveSubscription && currentPlanId && selectedPlanId === currentPlanId);
  const isUpgrade = Boolean(hasActiveSubscription && currentPlan?.amountInr && selectedPlan?.amountInr && selectedPlan.amountInr > currentPlan.amountInr);
  const actionLabel = hasActiveSubscription
    ? samePlanSelected
      ? "Current plan selected"
      : isUpgrade
        ? "Upgrade subscription"
        : "Change subscription"
    : "Start subscription";
  const introCopy = hasActiveSubscription
    ? "Review your current plan, switch to another one, or cancel access."
    : "Start your first subscription in Razorpay to unlock scores, draw entry, and donation actions.";
  const selectionBadge = actionBadgeLabel(hasActiveSubscription, samePlanSelected, isUpgrade);

  return (
    <Panel className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-ink">Subscription control</h2>
        <p className="mt-1 text-sm muted-copy">{introCopy}</p>
      </div>

      <div className="surface-soft space-y-3 rounded-[1.75rem] border border-brand-emerald/16 p-5 shadow-[0_18px_36px_rgba(27,42,31,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-night/46">Current subscription</p>
            <h3 className="mt-2 text-[1.7rem] font-black tracking-[-0.03em] text-brand-ink">{currentPlan?.name ?? "No active subscription"}</h3>
          </div>
          <span className={`inline-flex min-w-[88px] items-center justify-center rounded-full border px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.18em] shadow-sm ${hasActiveSubscription ? "border-brand-emerald/55 bg-brand-emerald text-white dark:border-brand-emerald/48 dark:bg-brand-emerald dark:text-[#f8f5ef]" : "border-brand-gold/48 bg-brand-gold/18 text-brand-night dark:border-brand-gold/36 dark:bg-brand-gold/20 dark:text-[#f4eadb]"}`}>{hasActiveSubscription ? "Active" : "Inactive"}</span>
        </div>
        {currentPlan?.amountInr ? <p className="text-sm font-medium text-brand-night/72 dark:text-[#efe2cf]/82">{currency(currentPlan.amountInr)} {currentPlan.interval ? `· ${currentPlan.interval}` : ""}</p> : <p className="text-sm muted-copy">Choose a plan below to activate your membership.</p>}
      </div>

      <form className="space-y-4" onSubmit={onCheckout}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="grid flex-1 gap-2 text-sm muted-copy">
            {hasActiveSubscription ? "Change plan" : "Plan"}
            <select {...checkoutForm.register("planId")} disabled={checkoutDisabled}>
              {plans.length ? plans.map((plan) => <option key={plan._id} value={plan._id}>{plan.name} · {currency(plan.amountInr)}{currentPlanId === plan._id ? " · Current" : ""}</option>) : <option value="">No live plans available</option>}
            </select>
          </label>
          <span className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.16em] shadow-sm ${samePlanSelected ? "border-brand-night/20 bg-brand-night text-white dark:border-brand-night/10 dark:bg-[#f2eadf] dark:text-[#1b2a1f]" : isUpgrade ? "border-brand-gold/48 bg-brand-gold text-brand-night dark:border-brand-gold/40 dark:bg-brand-gold dark:text-[#1b2a1f]" : "border-brand-emerald/30 bg-brand-emerald/16 text-brand-night dark:border-brand-emerald/36 dark:bg-brand-emerald/18 dark:text-[#f4eadb]"}`}>{selectionBadge}</span>
        </div>
        {samePlanSelected ? <p className="rounded-2xl border border-brand-night/10 bg-brand-night/6 px-4 py-3 text-sm font-medium text-brand-night/72 dark:border-[#efe2cf]/10 dark:bg-[#efe2cf]/6 dark:text-[#efe2cf]/82">You are already on this plan. Select a different plan to upgrade or change your subscription.</p> : null}
        {!samePlanSelected ? <Button type="submit" disabled={checkoutDisabled}>{actionLabel}</Button> : null}
        {plansError ? <p className="text-sm text-[#8b5743]">Live plan fetch failed: {plansError}</p> : null}
        {!plansLoading && !plans.length ? <EmptyState title="Plans unavailable" message="Billing plans could not be loaded. Check the backend billing configuration and retry." /> : null}
      </form>

      {summary?.subscription ? (
        <form className="surface-soft space-y-4 rounded-[1.75rem] p-4" onSubmit={onCancel}>
          <label className="grid gap-2 text-sm muted-copy">
            Cancellation reason
            <textarea className="min-h-24" {...cancelForm.register("reason")} placeholder="Optional note for why you are cancelling" />
          </label>
          <DangerButton type="submit" className="min-w-[12rem] justify-center border-brand-blush/26 bg-brand-blush/12 text-[#8a4a38] shadow-[0_12px_24px_rgba(184,106,79,0.12)] hover:border-brand-blush/42 hover:bg-brand-blush/18 dark:border-brand-blush/30 dark:bg-brand-blush/18 dark:text-[#f4d8cb] dark:hover:bg-brand-blush/24 disabled:border-[#7f766a]/20 disabled:bg-[#2a322b] disabled:text-[#8d8579] dark:disabled:border-[#7f766a]/14 dark:disabled:bg-[#1d2620] dark:disabled:text-[#7f766a]" disabled={subscriptionStatus !== "active"}>Cancel subscription</DangerButton>
          {summary.subscription.cancellationReason ? <p className="text-sm muted-copy">Current reason: {summary.subscription.cancellationReason}</p> : null}
        </form>
      ) : null}
    </Panel>
  );
}

