import type { PropsWithChildren } from "react";
import { motion } from "framer-motion";
import { useThemeMode } from "../../lib/hooks/useThemeMode";
import type { SessionUser } from "../../lib/types/app";
import { Navbar } from "./Navbar";

export function AppShell({ children, session, setSession }: PropsWithChildren<{ session: SessionUser | null; setSession: (value: SessionUser | null) => void }>) {
  const { theme, toggleTheme } = useThemeMode();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="ambient-ring left-[-8rem] top-12 size-72 bg-brand-emerald/22" />
      <div className="ambient-ring right-[-6rem] top-56 size-64 bg-brand-gold/22" />
      <div className="ambient-ring bottom-12 left-1/3 size-72 bg-brand-blush/18" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[88rem] flex-col px-4 pb-12 sm:px-6 lg:px-8">
        <Navbar session={session} setSession={setSession} theme={theme} onToggleTheme={toggleTheme} />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }} className="flex-1">
          {children}
        </motion.div>
        <footer className="mt-12 border-t border-[#eadbc8]/80 py-6 text-sm muted-copy">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>Club & Cause · impact-led, admin-ready, submission-focused.</p>
            <p>Built for responsive public, subscriber, and admin experiences.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

