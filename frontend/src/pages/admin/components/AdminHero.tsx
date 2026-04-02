import { MetricCard } from "../../../components/MetricCard";
import { Panel } from "../../../components/Panel";
import { currency } from "../../../lib";
import type { AdminDashboard } from "../types";

export function AdminHero({ dashboard, pendingWinnerClaims }: { dashboard: AdminDashboard | null; pendingWinnerClaims: number }) {
  return (
    <Panel tone="strong" className="space-y-6 p-8">
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#efe2cf]/72">Admin control room</span>
      <div className="space-y-3">
        <h1 className="max-w-5xl text-[2.5rem] font-black tracking-[-0.05em] text-white sm:text-[3.2rem]">Draw operations, subscriber records, charity content, and winner workflows.</h1>
        <p className="max-w-3xl text-[1rem] leading-7 text-[#efe2cf]/82">Keep publishing cadence, back-office review, and reporting in sync from one operational surface.</p>
      </div>
      <div className="grid auto-rows-min content-start gap-4 md:grid-cols-2 xl:grid-cols-6">
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
