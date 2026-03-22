import type { PropsWithChildren } from "react";
import { motion } from "framer-motion";

export function Panel({ children, className = "", tone = "default" }: PropsWithChildren<{ className?: string; tone?: "default" | "strong" | "soft" }>) {
  const toneClass = tone === "strong"
    ? "surface-panel-strong"
    : tone === "soft"
      ? "rounded-[2rem] border border-slate-200/70 bg-[rgba(255,255,255,0.55)] shadow-[0_20px_55px_rgba(15,23,32,0.06)] backdrop-blur-md"
      : "surface-panel";

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`${toneClass} p-6 sm:p-7 ${className}`.trim()}
    >
      {children}
    </motion.section>
  );
}
