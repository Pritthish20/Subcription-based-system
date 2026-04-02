import { MetricCard } from "../../../components/MetricCard";
import { Panel } from "../../../components/Panel";
import type { DashboardSummary } from "../types";

function formatDrawMonth(month?: string) {
  if (!month) return "TBD";
  const date = new Date(`${month}-01T00:00:00.000Z`);
  return Number.isNaN(date.getTime())
    ? month
    : date.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function DashboardHero({ summary, subscriptionStatus, selectedCharityName, renewalLabel }: { summary: DashboardSummary | null; subscriptionStatus: string; selectedCharityName: string; renewalLabel: string }) {
  const upcomingDrawLabel = summary?.upcomingDraw
    ? `${formatDrawMonth(summary.upcomingDraw.month)} · ${summary.upcomingDraw.eligible ? "Eligible" : "Inactive subscription"}`
    : "TBD";

  return (
    <Panel tone="strong" className="space-y-5 p-8">
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Subscriber dashboard</span>
      <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{summary?.user?.fullName ?? "Your dashboard"}</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard value={subscriptionStatus} label="Subscription status" />
        <MetricCard value={summary?.drawsEntered ?? 0} label="Draws entered" />
        <MetricCard value={new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(summary?.winningsTotal ?? 0)} label="Total won" />
        <MetricCard value={`${summary?.user?.charityPercentage ?? 10}%`} label="Charity share" />
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-white/68">
        <span>Selected charity: {selectedCharityName}</span>
        <span>Renewal: {renewalLabel}</span>
        <span>Upcoming draw: {upcomingDrawLabel}</span>
      </div>
    </Panel>
  );
}
