import type { ReactNode } from "react";

export function InfoPill({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-slate-200/70 bg-white/85 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">{children}</span>;
}
