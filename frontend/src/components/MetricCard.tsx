import { motion } from "framer-motion";

type Tone = "default" | "success" | "accent" | "warning";

const accentMap: Record<Tone, string> = {
  default: "from-slate-900 to-slate-700 text-white",
  success: "from-brand-emerald to-emerald-500 text-white",
  accent: "from-brand-gold to-amber-400 text-slate-950",
  warning: "from-brand-blush to-orange-300 text-slate-950"
};

export function MetricCard({ value, label, tone = "default" }: { value: string | number; label: string; tone?: Tone }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-[1.7rem] border border-white/75 bg-white/85 p-5 shadow-[0_18px_48px_rgba(15,23,32,0.08)]"
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accentMap[tone]}`} />
      <strong className="block text-3xl font-black tracking-tight text-brand-night sm:text-[2.1rem]">{value}</strong>
      <span className="mt-2 block text-sm leading-6 text-slate-500">{label}</span>
    </motion.article>
  );
}
