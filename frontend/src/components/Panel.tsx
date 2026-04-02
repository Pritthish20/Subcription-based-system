import type { PropsWithChildren } from "react";
import { motion } from "framer-motion";

export function Panel({ children, className = "", tone = "default" }: PropsWithChildren<{ className?: string; tone?: "default" | "strong" | "soft" }>) {
  const toneClass = tone === "strong"
    ? "surface-panel-strong"
    : tone === "soft"
      ? "rounded-[2rem] border border-[#eadbc8] bg-[rgba(255,248,238,0.66)] shadow-[0_20px_55px_rgba(43,36,29,0.08)] backdrop-blur-md"
      : "surface-panel";

  return (
    <motion.section
      initial={{ opacity: 0, y: 20, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`${toneClass} p-6 sm:p-7 ${className}`.trim()}
    >
      {children}
    </motion.section>
  );
}
