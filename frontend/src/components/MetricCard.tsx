import { motion } from "framer-motion";

type Tone = "default" | "success" | "accent" | "warning";
type Size = "default" | "compact";

const accentMap: Record<Tone, string> = {
  default: "from-brand-night via-[#233428] to-brand-emerald text-white",
  success: "from-brand-emerald via-[#86a281] to-[#a8bf9f] text-brand-night",
  accent: "from-brand-gold via-[#d8ba82] to-[#ead7ae] text-brand-night",
  warning: "from-brand-blush via-[#cb8f78] to-[#e9b8a4] text-brand-night"
};

const sizeMap: Record<Size, { card: string; value: string; label: string; labelSpacing: string }> = {
  default: {
    card: "min-h-[10.75rem] rounded-[1.8rem] p-5",
    value: "text-[3.3rem] sm:text-[3.85rem]",
    label: "text-[1.35rem] sm:text-[1.5rem]",
    labelSpacing: "mt-6"
  },
  compact: {
    card: "min-h-[8.8rem] rounded-[1.55rem] p-4",
    value: "text-[2.55rem] sm:text-[2.95rem]",
    label: "text-[1.02rem] sm:text-[1.08rem]",
    labelSpacing: "mt-4"
  }
};

export function MetricCard({ value, label, tone = "default", size = "default" }: { value: string | number; label: string; tone?: Tone; size?: Size }) {
  const scale = sizeMap[size];

  return (
    <motion.article
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className={`relative flex h-full flex-col justify-between overflow-hidden border border-[#f3e8da] bg-[#fffaf3]/88 shadow-[0_18px_48px_rgba(43,36,29,0.08)] ${scale.card}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accentMap[tone]}`} />
      <div className="absolute -right-6 top-6 h-20 w-20 rounded-full bg-white/30 blur-2xl" />
      <strong className={`relative block font-black leading-none tracking-[-0.06em] text-brand-night ${scale.value}`}>{value}</strong>
      <span className={`relative block max-w-[14ch] leading-[1.35] tracking-[-0.02em] text-[#7c6d5d] ${scale.labelSpacing} ${scale.label}`}>{label}</span>
    </motion.article>
  );
}
