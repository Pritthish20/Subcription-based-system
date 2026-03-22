import { LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="surface-panel flex min-h-52 flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-brand-night text-white shadow-[0_20px_48px_rgba(17,26,42,0.2)]">
        <LoaderCircle className="animate-spin" size={24} />
      </div>
      <div>
        <p className="text-base font-semibold text-brand-night">{label}</p>
        <p className="mt-1 text-sm text-slate-500">We are preparing the next view.</p>
      </div>
    </div>
  );
}
