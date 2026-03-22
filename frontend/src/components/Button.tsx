import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "border border-brand-night/90 bg-brand-night text-white shadow-[0_18px_40px_rgba(17,26,42,0.22)] hover:-translate-y-0.5 hover:border-brand-night hover:bg-[#0c1320]",
  secondary: "border border-brand-emerald/20 bg-brand-emerald/10 text-brand-night hover:-translate-y-0.5 hover:border-brand-emerald/35 hover:bg-brand-emerald/16",
  ghost: "border border-white/70 bg-white/72 text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white",
  danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-100"
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2.5 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-3.5 text-[0.95rem]"
};

export function Button({ children, className = "", variant = "primary", size = "md", ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export const SecondaryButton = (props: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) => <Button variant="secondary" {...props} />;
export const GhostButton = (props: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) => <Button variant="ghost" {...props} />;
export const DangerButton = (props: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) => <Button variant="danger" {...props} />;
