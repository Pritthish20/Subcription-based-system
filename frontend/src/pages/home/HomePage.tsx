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
      <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
        <Panel tone="strong" className="relative overflow-hidden px-7 py-7 sm:px-9 sm:py-8">
          <div className="grid-overlay absolute inset-0 opacity-20" />
          <div className="relative space-y-6">
            <div className="space-y-4">
              <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.45 }} className="inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/74">Impact-led golf subscription</motion.span>
              <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.55 }} className="max-w-5xl text-[2.25rem] font-black leading-[0.92] tracking-[-0.055em] text-white sm:text-[2.9rem] xl:text-[3.55rem]">Back a cause, track your last five rounds, and move into a monthly prize draw without the usual golf cliche aesthetic.</motion.h1>
              <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.55 }} className="max-w-3xl text-[0.98rem] leading-7 text-[#efe2cf]/86 sm:text-[1.02rem]">This platform is built around emotional impact first: charities stay visible, subscribers stay engaged, and admins keep full control over score logic, draw publishing, and winner verification.</motion.p>
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.5 }} className="flex flex-wrap gap-3">
              <NavLink to="/auth" className="inline-flex items-center justify-center rounded-full bg-[#fff7ec] px-6 py-3.5 text-sm font-semibold tracking-[0.01em] text-brand-night transition hover:bg-[#fffdf8]">Join now</NavLink>
              <NavLink to="/charities" className="inline-flex items-center justify-center rounded-full border border-white/18 bg-white/8 px-6 py-3.5 text-sm font-semibold tracking-[0.01em] text-white transition hover:bg-white/12">Explore charities</NavLink>
              <NavLink to="/draws/explainer" className="inline-flex items-center justify-center rounded-full border border-white/18 bg-transparent px-6 py-3.5 text-sm font-semibold tracking-[0.01em] text-white/88 transition hover:bg-white/10">See how it works</NavLink>
            </motion.div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Score model", "Latest 5 Stableford rounds"],
                ["Jackpot layer", "40% 5-match rollover pool"],
                ["Charity floor", "10% minimum contribution"]
              ].map(([label, value], index) => (
                <motion.div key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 + index * 0.08, duration: 0.48 }} className="rounded-[1.5rem] border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/56">{label}</p>
                  <p className="mt-2 text-[0.98rem] font-semibold leading-6 tracking-[-0.02em] text-white">{value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Panel>

        <div className="grid h-full grid-cols-2 gap-4 self-stretch lg:auto-rows-fr">
          <MetricCard value="5" label="Latest scores retained" tone="success" />
          <MetricCard value="40%" label="Top-tier jackpot share" tone="accent" />
          <MetricCard value="10%" label="Minimum charity contribution" tone="warning" />
          <MetricCard value="2" label="Plan options to launch with" />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {highlights.map(({ title, body, icon: Icon }, index) => (
          <motion.div key={title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <Panel className="h-full space-y-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-emerald/14 text-brand-emerald shadow-[0_14px_30px_rgba(110,143,106,0.12)]">
                <Icon size={20} />
              </div>
              <div>
                <h2 className="text-[1.32rem] font-bold tracking-[-0.03em] text-brand-night">{title}</h2>
                <p className="mt-2 text-[0.96rem] leading-7 text-[#6f6153]">{body}</p>
              </div>
            </Panel>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel className="space-y-5">
          <div>
            <span className="eyebrow">Plans</span>
            <h2 className="mt-3 text-[2.1rem] font-black tracking-[-0.05em] text-brand-night">Subscription options built for a clean entry point.</h2>
          </div>
          {plans.length ? (
            <div className="grid gap-4">
              {plans.map((plan, index) => (
                <div key={plan._id} className={`rounded-[1.7rem] border px-5 py-5 ${index === 0 ? "border-brand-emerald/24 bg-brand-emerald/10" : "border-[#eadbc8]/90 bg-[#f8efe4]/78"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#8a7a68]">{plan.interval}</p>
                      <h3 className="mt-2 text-[1.8rem] font-bold tracking-[-0.03em] text-brand-night">{plan.name}</h3>
                    </div>
                    <div className="rounded-full bg-[#fffaf3] px-4 py-2 text-sm font-semibold text-brand-night shadow-sm">{currency(plan.amountInr)}</div>
                  </div>
                  <p className="mt-4 text-[0.96rem] leading-7 text-[#6f6153]">Supports charity selection, subscriber eligibility checks, and monthly draw entry without adding friction to onboarding.</p>
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
              <h2 className="mt-3 text-[2.1rem] font-black tracking-[-0.05em] text-brand-night">Support a visible cause, not a hidden backend setting.</h2>
            </div>
            <NavLink to="/charities" className="hidden rounded-full border border-[#e5d8c7] bg-[#fffaf3] px-4 py-2 text-sm font-semibold tracking-[0.01em] text-brand-night transition hover:bg-[#fffdf8] sm:inline-flex">All charities</NavLink>
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
