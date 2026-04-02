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

function formatStatus(status?: string) {
  if (!status) return "Inactive";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

export function DashboardHero({ summary, subscriptionStatus, selectedCharityName, renewalLabel }: { summary: DashboardSummary | null; subscriptionStatus: string; selectedCharityName: string; renewalLabel: string }) {
  const upcomingDrawLabel = summary?.upcomingDraw
    ? `${formatDrawMonth(summary.upcomingDraw.month)} · ${summary.upcomingDraw.eligible ? "Eligible" : "Inactive subscription"}`
    : "TBD";
  const activePlanName = summary?.subscription?.planId?.name ?? "No active plan";

  return (
    <Panel tone="strong" className="space-y-6 p-8">
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#efe2cf]/72">Subscriber dashboard</span>
      <div className="space-y-3">
        <h1 className="text-[2.55rem] font-black tracking-[-0.05em] text-white sm:text-[3.25rem]">{summary?.user?.fullName ?? "Your dashboard"}</h1>
        <p className="max-w-3xl text-[1rem] leading-7 text-[#efe2cf]/82">Monitor your subscription, keep your score history current, and stay ready for the next published draw.</p>
      </div>
      <div className="grid auto-rows-min content-start gap-4 md:grid-cols-4">
        <MetricCard value={formatStatus(subscriptionStatus)} label="Subscription status" />
        <MetricCard value={summary?.drawsEntered ?? 0} label="Draws entered" />
        <MetricCard value={new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(summary?.winningsTotal ?? 0)} label="Total won" />
        <MetricCard value={`${summary?.user?.charityPercentage ?? 10}%`} label="Charity share" />
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="detail-chip">Active plan: {activePlanName}</span>
        <span className="detail-chip">Selected charity: {selectedCharityName}</span>
        <span className="detail-chip">Renewal: {renewalLabel}</span>
        <span className="detail-chip">Upcoming draw: {upcomingDrawLabel}</span>
      </div>
    </Panel>
  );
}
