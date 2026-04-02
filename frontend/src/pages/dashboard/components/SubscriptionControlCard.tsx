import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { CancelSubscriptionInput, CheckoutInput } from "@shared/index";
import { Button, SecondaryButton } from "../../../components/Button";
import { Panel } from "../../../components/Panel";
import { EmptyState } from "../../../components/ui/EmptyState";
import { currency } from "../../../lib";
import type { DashboardSummary } from "../types";
import type { Plan } from "../../../lib/types/app";

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

  return (
    <Panel className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-ink">Subscription control</h2>
        <p className="mt-1 text-sm muted-copy">{introCopy}</p>
      </div>

      <div className="surface-soft space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-night/56">Current subscription</p>
            <h3 className="mt-1 text-xl font-bold text-brand-ink">{currentPlan?.name ?? "No active subscription"}</h3>
          </div>
          <span className="rounded-full border border-brand-emerald/22 bg-brand-emerald/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-night/74">{subscriptionStatus || "inactive"}</span>
        </div>
        {currentPlan?.amountInr ? <p className="text-sm muted-copy">{currency(currentPlan.amountInr)} {currentPlan.interval ? `· ${currentPlan.interval}` : ""}</p> : <p className="text-sm muted-copy">Choose a plan below to activate your membership.</p>}
      </div>

      <form className="space-y-4" onSubmit={onCheckout}>
        <label className="grid gap-2 text-sm muted-copy">
          {hasActiveSubscription ? "Change plan" : "Plan"}
          <select {...checkoutForm.register("planId")} disabled={checkoutDisabled}>
            {plans.length ? plans.map((plan) => <option key={plan._id} value={plan._id}>{plan.name} · {currency(plan.amountInr)}{currentPlanId === plan._id ? " · Current" : ""}</option>) : <option value="">No live plans available</option>}
          </select>
        </label>
        {samePlanSelected ? <p className="text-sm muted-copy">You are already on this plan. Select a different plan to upgrade or change your subscription.</p> : null}
        <Button type="submit" disabled={checkoutDisabled || samePlanSelected}>{actionLabel}</Button>
        {plansError ? <p className="text-sm text-[#8b5743]">Live plan fetch failed: {plansError}</p> : null}
        {!plansLoading && !plans.length ? <EmptyState title="Plans unavailable" message="Billing plans could not be loaded. Check the backend billing configuration and retry." /> : null}
      </form>

      {summary?.subscription ? (
        <form className="surface-soft space-y-4 p-4" onSubmit={onCancel}>
          <label className="grid gap-2 text-sm muted-copy">
            Cancellation reason
            <textarea className="min-h-24" {...cancelForm.register("reason")} placeholder="Optional note for why you are cancelling" />
          </label>
          <SecondaryButton type="submit" disabled={subscriptionStatus !== "active"}>Cancel subscription</SecondaryButton>
          {summary.subscription.cancellationReason ? <p className="text-sm muted-copy">Current reason: {summary.subscription.cancellationReason}</p> : null}
        </form>
      ) : null}
    </Panel>
  );
}
