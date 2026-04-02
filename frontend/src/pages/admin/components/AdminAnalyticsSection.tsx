import { MetricCard } from "../../../components/MetricCard";
import { Panel } from "../../../components/Panel";
import { EmptyState } from "../../../components/ui/EmptyState";
import { currency } from "../../../lib";
import type { Charity } from "../../../lib/types/app";
import type { AdminDashboard } from "../types";
import { InfoPill } from "./InfoPill";

export function AdminAnalyticsSection({ dashboard, charities, featuredCharities }: { dashboard: AdminDashboard | null; charities: Charity[]; featuredCharities: number }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr_0.95fr]">
      <Panel className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-ink">Contribution analytics</h2>
          <p className="mt-1 text-sm muted-copy">Ledger-backed totals across subscription allocations, independent donations, and charity selection behavior.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard value={currency(dashboard?.charityContributionTotals ?? 0)} label="Total charity contribution" size="compact" />
          <MetricCard value={currency(dashboard?.subscriptionDonationTotals ?? 0)} label="Subscription allocations" size="compact" />
          <MetricCard value={currency(dashboard?.independentDonationTotals ?? 0)} label="Independent donations" size="compact" />
          <MetricCard value={`${Math.round(dashboard?.avgCharityPercentage ?? 0)}%`} label="Avg charity percentage" size="compact" />
        </div>
        <div className="surface-soft px-5 py-4 text-sm muted-copy">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-semibold text-brand-ink">Featured charities</span>
            <InfoPill>{featuredCharities}</InfoPill>
          </div>
          <p className="mt-2">{dashboard?.charities ?? charities.length} charities are currently available for signup and supporter selection.</p>
        </div>
      </Panel>

      <Panel className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-ink">Operations and delivery</h2>
          <p className="mt-1 text-sm muted-copy">A quick view of draw throughput, claims handling, payouts, and notification health.</p>
        </div>
        <div className="grid gap-3 text-sm muted-copy">
          <div className="theme-card rounded-2xl px-4 py-4">
            <div className="flex items-center justify-between gap-3"><span className="font-semibold text-brand-ink">Draws published</span><InfoPill>{dashboard?.publishedDraws ?? 0}</InfoPill></div>
            <p className="mt-2">Approved claims: {dashboard?.approvedWinnerClaims ?? 0} | Rejected claims: {dashboard?.rejectedWinnerClaims ?? 0}</p>
          </div>
          <div className="theme-card rounded-2xl px-4 py-4">
            <div className="flex items-center justify-between gap-3"><span className="font-semibold text-brand-ink">Payout status</span><InfoPill>{dashboard?.paidWinnerClaims ?? 0} paid</InfoPill></div>
            <p className="mt-2">Total payout amount recorded: {currency(dashboard?.totalPayouts ?? 0)}</p>
          </div>
          <div className="theme-card rounded-2xl px-4 py-4">
            <div className="flex items-center justify-between gap-3"><span className="font-semibold text-brand-ink">Email delivery</span><InfoPill>{dashboard?.notificationStats.sent ?? 0} sent</InfoPill></div>
            <p className="mt-2">Queued: {dashboard?.notificationStats.queued ?? 0} | Failed: {dashboard?.notificationStats.failed ?? 0} | Skipped: {dashboard?.notificationStats.skipped ?? 0}</p>
          </div>
        </div>
      </Panel>

      <Panel className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-ink">Latest published draw</h2>
          <p className="mt-1 text-sm muted-copy">Keep the most recent official result visible while running the next cycle.</p>
        </div>
        {dashboard?.latestPublishedDraw ? (
          <div className="surface-soft space-y-4 px-5 py-5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-lg font-bold tracking-[-0.03em] text-brand-ink">{dashboard.latestPublishedDraw.month}</span>
              <InfoPill>{dashboard.latestPublishedDraw.officialNumbers.length} numbers</InfoPill>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {dashboard.latestPublishedDraw.officialNumbers.map((number) => (
                <span key={number} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-[#e3d3bf] bg-[#fff8ef] px-3 py-2 text-sm font-bold text-[#2b241d] shadow-[0_10px_22px_rgba(43,36,29,0.08)] dark:border-[#e7d9c6] dark:bg-[#fff5e8] dark:text-[#1b201a]">{number}</span>
              ))}
            </div>
            <div className="space-y-2 text-[0.95rem]">
              <p className="font-medium text-brand-ink">Rollover carried: <span className="text-brand-gold dark:text-[#e0c38f]">{currency(dashboard.latestPublishedDraw.rolloverAmount ?? 0)}</span></p>
              <p className="text-brand-ink/78 dark:text-[#efe2cf]/84">Published at: {dashboard.latestPublishedDraw.publishedAt ? new Date(dashboard.latestPublishedDraw.publishedAt).toLocaleString() : "Recently published"}</p>
            </div>
          </div>
        ) : (
          <EmptyState title="No published draw yet" message="Run and publish the first official draw to unlock the result summary here." />
        )}
      </Panel>
    </section>
  );
}
