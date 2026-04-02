import type { ReactNode } from "react";

export function InfoPill({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-[#decfbc] bg-[#fff8ef]/88 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b6a58] shadow-sm">{children}</span>;
}
