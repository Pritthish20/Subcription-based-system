import { AlertCircle } from "lucide-react";
import { Button } from "../Button";

export function ErrorState({ title = "Something went wrong", message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div className="surface-panel border-rose-200/70 bg-[linear-gradient(180deg,rgba(255,244,244,0.95),rgba(255,250,250,0.92))] p-7 text-left text-slate-900">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <AlertCircle size={20} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-rose-700/90">{message}</p>
          {onRetry ? <Button className="mt-5" onClick={onRetry}>Try again</Button> : null}
        </div>
      </div>
    </div>
  );
}
