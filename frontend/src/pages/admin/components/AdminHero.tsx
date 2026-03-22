import { MetricCard } from "../../../components/MetricCard";
import { Panel } from "../../../components/Panel";
import { currency } from "../../../lib";
import type { AdminDashboard } from "../types";

export function AdminHero({ dashboard, pendingWinnerClaims }: { dashboard: AdminDashboard | null; pendingWinnerClaims: number }) {
  return (
    <Panel tone="strong" className="space-y-5 p-8">
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Admin control room</span>
      <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Draw operations, subscriber records, charity content, and winner workflows.</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard value={dashboard?.totalUsers ?? 0} label="Total users" />
        <MetricCard value={dashboard?.activeSubscriptions ?? 0} label="Active subs" />
        <MetricCard value={dashboard?.inactiveSubscriptions ?? 0} label="Inactive subs" />
        <MetricCard value={currency(dashboard?.totalPrizePool ?? 0)} label="Prize pool" />
        <MetricCard value={currency(dashboard?.totalPayouts ?? 0)} label="Payouts sent" />
        <MetricCard value={pendingWinnerClaims} label="Pending winner claims" />
      </div>
    </Panel>
  );
}
