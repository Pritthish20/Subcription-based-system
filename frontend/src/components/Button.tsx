import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";
type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }>;

type VariantButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { size?: Size }>;

const variantClasses: Record<Variant, string> = {
  primary: "border border-brand-night/90 bg-brand-night text-white shadow-[0_18px_40px_rgba(27,42,31,0.24)] hover:-translate-y-0.5 hover:border-[#243629] hover:bg-[#243629] focus-visible:ring-brand-emerald/18",
  secondary: "border border-brand-emerald/28 bg-brand-emerald/14 text-brand-night shadow-[0_14px_32px_rgba(110,143,106,0.12)] hover:-translate-y-0.5 hover:border-brand-emerald/42 hover:bg-brand-emerald/20 focus-visible:ring-brand-emerald/18",
  ghost: "border border-[#e5d8c7] bg-[#fff8ef]/88 text-[#2b241d] hover:-translate-y-0.5 hover:border-[#d2bea4] hover:bg-[#fffdf8] focus-visible:ring-brand-gold/18 dark:border-[#eadbc8]/28 dark:bg-[#f7ead7] dark:text-[#1b2a1f] dark:hover:bg-[#fff5e8]",
  danger: "border border-brand-blush/20 bg-brand-blush/10 text-[#7a4333] hover:-translate-y-0.5 hover:border-brand-blush/30 hover:bg-brand-blush/16 focus-visible:ring-brand-blush/18"
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2.5 text-[0.82rem]",
  md: "px-5 py-3 text-[0.92rem]",
  lg: "px-6 py-3.5 text-[0.98rem]"
};

export function Button({ children, className = "", variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[0.01em] transition duration-200 transform-gpu focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export const SecondaryButton = (props: VariantButtonProps) => <Button variant="secondary" {...props} />;
export const GhostButton = (props: VariantButtonProps) => <Button variant="ghost" {...props} />;
export const DangerButton = (props: VariantButtonProps) => <Button variant="danger" {...props} />;
