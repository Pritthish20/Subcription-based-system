import type { ReactNode } from "react";

export function InfoPill({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-[#d4c2aa] bg-[#fff7ec] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#8a7157] shadow-sm dark:border-[#ccb89d] dark:bg-[#fff3e4] dark:text-[#86684b]">{children}</span>;
}
