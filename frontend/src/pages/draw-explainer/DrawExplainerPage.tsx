import { ArrowRight, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Panel } from "../../components/Panel";

const steps = [
  {
    title: "Subscribe",
    body: "Choose a monthly or yearly plan, select a charity, and activate access through the subscription flow.",
    icon: Sparkles
  },
  {
    title: "Add your last 5 scores",
    body: "Stableford scores stay capped at five entries, with the oldest score rolling off automatically when a new round is submitted.",
    icon: Trophy
  },
  {
    title: "Verify and get paid",
    body: "Winners upload proof, admins review the evidence, and payout status moves from pending to paid.",
    icon: ShieldCheck
  }
];

const tiers = [
  { name: "5-match", share: "40%", note: "Jackpot tier with rollover if nobody hits all 5 numbers." },
  { name: "4-match", share: "35%", note: "Split equally across all qualifying winners for that month." },
  { name: "3-match", share: "25%", note: "Keeps the draw approachable while preserving a meaningful jackpot layer." }
];

export function DrawExplainerPage() {
  return (
    <main className="space-y-8">
      <Panel tone="strong" className="relative overflow-hidden px-7 py-8 sm:px-9 sm:py-10">
        <div className="grid-overlay absolute inset-0 opacity-20" />
        <div className="relative grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div className="space-y-5">
            <span className="inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/72">How it works</span>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl xl:text-6xl">A charity-first draw loop built around recent form, not stale golf cliches.</h1>
            <p className="max-w-3xl text-base leading-7 text-white/72">The monthly flow is intentionally simple: subscribe, keep your latest scores current, support a cause, and let the admin-published draw determine the prize outcomes.</p>
            <div className="flex flex-wrap gap-3">
              <NavLink to="/auth" className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-night transition hover:bg-white/90">Join the platform</NavLink>
              <NavLink to="/draws/results" className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12">See published results <ArrowRight size={16} /></NavLink>
            </div>
          </div>
          <Panel tone="soft" className="space-y-3 bg-white/90 text-slate-900">
            <h2 className="text-2xl font-bold text-brand-night">Core rules</h2>
            <ul className="space-y-3 text-sm leading-6 text-slate-600">
              <li>Only active subscribers participate in official monthly draws.</li>
              <li>Only the latest five Stableford scores are retained per subscriber.</li>
              <li>Official draws use five numbers in the 1-45 range.</li>
              <li>Winner proof is mandatory before payout is confirmed.</li>
            </ul>
          </Panel>
        </div>
      </Panel>

      <section className="grid gap-5 lg:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Panel key={step.title} className="space-y-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-emerald/10 text-brand-emerald"><Icon size={20} /></div>
              <div>
                <span className="eyebrow">Step {index + 1}</span>
                <h2 className="mt-3 text-2xl font-bold text-brand-night">{step.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{step.body}</p>
              </div>
            </Panel>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {tiers.map((tier, index) => (
          <Panel key={tier.name} className="space-y-3">
            <span className="eyebrow">Prize tier</span>
            <h2 className="text-3xl font-black tracking-tight text-brand-night">{tier.name}</h2>
            <p className={`text-lg font-semibold ${index === 0 ? "text-brand-emerald" : index === 1 ? "text-brand-gold" : "text-brand-blush"}`}>{tier.share} of the pool</p>
            <p className="text-sm leading-7 text-slate-600">{tier.note}</p>
          </Panel>
        ))}
      </section>
    </main>
  );
}
