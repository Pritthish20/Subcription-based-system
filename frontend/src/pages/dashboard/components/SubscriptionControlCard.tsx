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
  return (
    <Panel className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-ink">Subscription control</h2>
        <p className="mt-1 text-sm muted-copy">Start a new plan in Razorpay, review your renewal date, or cancel access.</p>
      </div>
      <form className="space-y-4" onSubmit={onCheckout}>
        <label className="grid gap-2 text-sm muted-copy">
          Plan
          <select {...checkoutForm.register("planId")} disabled={checkoutDisabled}>
            {plans.length ? plans.map((plan) => <option key={plan._id} value={plan._id}>{plan.name} · {currency(plan.amountInr)}</option>) : <option value="">No live plans available</option>}
          </select>
        </label>
        <Button type="submit" disabled={checkoutDisabled}>Continue to payment</Button>
        {plansError ? <p className="text-sm text-[#8b5743]">Live plan fetch failed: {plansError}</p> : null}
        {!plansLoading && !plans.length ? <EmptyState title="Plans unavailable" message="Billing plans could not be loaded. Check the backend billing configuration and retry." /> : null}
      </form>

      <form className="surface-soft space-y-4 p-4" onSubmit={onCancel}>
        <label className="grid gap-2 text-sm muted-copy">
          Cancellation reason
          <textarea className="min-h-24" {...cancelForm.register("reason")} placeholder="Optional note for why you are cancelling" />
        </label>
        <SecondaryButton type="submit" disabled={!summary?.subscription || subscriptionStatus === "cancelled"}>Cancel subscription</SecondaryButton>
        {summary?.subscription?.cancellationReason ? <p className="text-sm muted-copy">Current reason: {summary.subscription.cancellationReason}</p> : null}
      </form>
    </Panel>
  );
}
