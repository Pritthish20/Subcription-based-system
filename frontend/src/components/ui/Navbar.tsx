import { LogOut, Shield, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { ThemeMode } from "../../lib/hooks/useThemeMode";
import { clearSessionStorage, request, storage } from "../../lib";
import type { SessionUser } from "../../lib/types/app";
import { GhostButton } from "../Button";
import { ThemeToggle } from "./ThemeToggle";

const navClass = ({ isActive }: { isActive: boolean }) => `rounded-full px-4 py-2.5 text-sm font-medium transition ${isActive ? "bg-brand-night text-white shadow-[0_14px_30px_rgba(17,26,42,0.16)]" : "muted-copy hover:bg-white/75 hover:text-brand-ink"}`;

export function Navbar({ session, setSession, theme, onToggleTheme }: { session: SessionUser | null; setSession: (value: SessionUser | null) => void; theme: ThemeMode; onToggleTheme: () => void }) {
  async function handleLogout() {
    try {
      if (storage.refreshToken) {
        await request("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken: storage.refreshToken }) });
      }
    } catch {
      // Clear local session even if the backend logout request fails.
    } finally {
      clearSessionStorage();
      setSession(null);
    }
  }

  return (
    <header className="sticky top-0 z-30 mb-8 pt-4">
      <div className="surface-panel flex flex-col gap-4 px-5 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <NavLink to="/" className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-night text-white shadow-[0_18px_34px_rgba(17,26,42,0.22)]"><Sparkles size={18} /></span>
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-brand-emerald">Digital Heroes</p>
              <p className="text-lg font-black tracking-tight text-brand-ink">Golf Charity Platform</p>
            </div>
          </NavLink>
          {session ? <span className="hidden rounded-full border border-brand-emerald/15 bg-brand-emerald/8 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-brand-emerald sm:inline-flex">{session.role}</span> : null}
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <NavLink className={navClass} to="/charities">Charities</NavLink>
          <NavLink className={navClass} to="/draws/explainer">How It Works</NavLink>
          <NavLink className={navClass} to="/draws/results">Results</NavLink>
          {!session?._id ? <NavLink className={navClass} to="/auth">Join</NavLink> : null}
          {session?._id ? <NavLink className={navClass} to="/dashboard">Dashboard</NavLink> : null}
          {session?.role === "admin" ? <NavLink className={navClass} to="/admin"><span className="inline-flex items-center gap-2"><Shield size={15} /> Admin</span></NavLink> : null}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          {session ? <GhostButton onClick={() => void handleLogout()}><LogOut size={16} /> Logout</GhostButton> : null}
        </nav>
      </div>
    </header>
  );
}
