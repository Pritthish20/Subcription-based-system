import { HeartHandshake, Trophy, WalletCards } from "lucide-react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { CharityCard } from "../../components/CharityCard";
import { MetricCard } from "../../components/MetricCard";
import { Panel } from "../../components/Panel";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import type { Charity, Plan } from "../../lib/types/app";
import { currency } from "../../lib";

const highlights = [
  {
    title: "Charity-led onboarding",
    body: "Support choice happens up front, so the product feels purpose-driven before it feels competitive.",
    icon: HeartHandshake
  },
  {
    title: "Monthly reward engine",
    body: "Subscriber scores feed a monthly draw that can be simulated, reviewed, and officially published by admins.",
    icon: Trophy
  },
  {
    title: "Transparent allocations",
    body: "Prize pools, charity allocations, and payouts are recorded in ledgers for clear operations and reporting.",
    icon: WalletCards
  }
];

export function HomePage({ charities, plans, isLoading, error, onRetry }: { charities: Charity[]; plans: Plan[]; isLoading: boolean; error: string | null; onRetry: () => void }) {
  if (isLoading && !charities.length && !plans.length) return <LoadingState label="Loading homepage" />;
  if (error && !charities.length && !plans.length) return <ErrorState message={error} onRetry={onRetry} />;

  return (
    <main className="space-y-8 pb-6">
      <section className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <Panel tone="strong" className="relative overflow-hidden px-7 py-8 sm:px-9 sm:py-10">
          <div className="grid-overlay absolute inset-0 opacity-20" />
          <div className="relative space-y-7">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/72">Impact-led golf subscription</span>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl xl:text-6xl">Back a cause, track your last five rounds, and move into a monthly prize draw without the usual golf cliché aesthetic.</h1>
              <p className="max-w-2xl text-base leading-7 text-white/72 sm:text-lg">This platform is built around emotional impact first: charities stay visible, subscribers stay engaged, and admins keep full control over score logic, draw publishing, and winner verification.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <NavLink to="/auth" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-brand-night transition hover:bg-white/90">Join now</NavLink>
              <NavLink to="/charities" className="inline-flex items-center justify-center rounded-full border border-white/18 bg-white/8 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/12">Explore charities</NavLink>
              <NavLink to="/draws/explainer" className="inline-flex items-center justify-center rounded-full border border-white/18 bg-transparent px-6 py-3.5 text-sm font-semibold text-white/86 transition hover:bg-white/10">See how it works</NavLink>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/8 px-5 py-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-white/55">Score model</p>
                <p className="mt-2 text-lg font-semibold text-white">Latest 5 Stableford rounds</p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/8 px-5 py-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-white/55">Jackpot layer</p>
                <p className="mt-2 text-lg font-semibold text-white">40% 5-match rollover pool</p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/8 px-5 py-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-white/55">Charity floor</p>
                <p className="mt-2 text-lg font-semibold text-white">10% minimum contribution</p>
              </div>
            </div>
          </div>
        </Panel>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <MetricCard value="5" label="Latest scores retained" tone="success" />
          <MetricCard value="40%" label="Top-tier jackpot share" tone="accent" />
          <MetricCard value="10%" label="Minimum charity contribution" tone="warning" />
          <MetricCard value="2" label="Plan options to launch with" />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {highlights.map(({ title, body, icon: Icon }, index) => (
          <motion.div key={title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
            <Panel className="h-full space-y-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-emerald/10 text-brand-emerald">
                <Icon size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-brand-night">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{body}</p>
              </div>
            </Panel>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel className="space-y-5">
          <div>
            <span className="eyebrow">Plans</span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-brand-night">Subscription options built for a clean entry point.</h2>
          </div>
          {plans.length ? (
            <div className="grid gap-4">
              {plans.map((plan, index) => (
                <div key={plan._id} className={`rounded-[1.7rem] border px-5 py-5 ${index === 0 ? "border-brand-emerald/22 bg-brand-emerald/6" : "border-slate-200/80 bg-slate-50/70"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-500">{plan.interval}</p>
                      <h3 className="mt-2 text-2xl font-bold text-brand-night">{plan.name}</h3>
                    </div>
                    <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-night shadow-sm">{currency(plan.amountInr)}</div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">Supports charity selection, subscriber eligibility checks, and monthly draw entry without adding friction to onboarding.</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Plans unavailable" message="Live subscription plans could not be loaded. Check the billing configuration or try again." />
          )}
        </Panel>

        <Panel className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="eyebrow">Spotlight causes</span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-brand-night">Support a visible cause, not a hidden backend setting.</h2>
            </div>
            <NavLink to="/charities" className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-night transition hover:bg-slate-50 sm:inline-flex">All charities</NavLink>
          </div>
          {charities.length ? (
            <div className="grid gap-5">
              {charities.slice(0, 2).map((charity) => <CharityCard key={charity._id} charity={charity} />)}
            </div>
          ) : (
            <EmptyState title="Charities unavailable" message="Live charity data could not be loaded. Check the API connection or try again." />
          )}
        </Panel>
      </section>
    </main>
  );
}
