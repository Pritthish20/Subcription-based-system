import { motion } from "framer-motion";

type Tone = "default" | "success" | "accent" | "warning";

const accentMap: Record<Tone, string> = {
  default: "from-brand-night via-[#233428] to-brand-emerald text-white",
  success: "from-brand-emerald via-[#86a281] to-[#a8bf9f] text-brand-night",
  accent: "from-brand-gold via-[#d8ba82] to-[#ead7ae] text-brand-night",
  warning: "from-brand-blush via-[#cb8f78] to-[#e9b8a4] text-brand-night"
};

export function MetricCard({ value, label, tone = "default" }: { value: string | number; label: string; tone?: Tone }) {
  return (
    <motion.article
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className="relative flex h-full min-h-[10.75rem] flex-col justify-between overflow-hidden rounded-[1.8rem] border border-[#f3e8da] bg-[#fffaf3]/88 p-5 shadow-[0_18px_48px_rgba(43,36,29,0.08)]"
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accentMap[tone]}`} />
      <div className="absolute -right-6 top-6 h-20 w-20 rounded-full bg-white/30 blur-2xl" />
      <strong className="relative block text-[3.3rem] font-black leading-none tracking-[-0.06em] text-brand-night sm:text-[3.85rem]">{value}</strong>
      <span className="relative mt-6 block max-w-[14ch] text-[1.35rem] leading-[1.35] tracking-[-0.02em] text-[#7c6d5d] sm:text-[1.5rem]">{label}</span>
    </motion.article>
  );
}
