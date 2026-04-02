import { MoonStar, SunMedium } from "lucide-react";
import type { ThemeMode } from "../../lib/hooks/useThemeMode";

export function ThemeToggle({ theme, onToggle }: { theme: ThemeMode; onToggle: () => void }) {
  const isDark = theme === "dark";
  const buttonClass = isDark
    ? "border border-[#eadbc8]/28 bg-[#f7ead7] text-[#1b2a1f] shadow-[0_12px_28px_rgba(15,23,18,0.16)] hover:bg-[#fff5e8]"
    : "border border-[#e5d8c7] bg-[#fff8ef]/88 text-[#2b241d] hover:border-[#d2bea4] hover:bg-[#fffdf8]";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${buttonClass}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
      <span>{isDark ? "Day mode" : "Night mode"}</span>
    </button>
  );
}
