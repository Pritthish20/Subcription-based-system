import { AlertCircle } from "lucide-react";
import { Button } from "../Button";

export function ErrorState({ title = "Something went wrong", message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div className="surface-panel border border-brand-blush/24 bg-[linear-gradient(180deg,rgba(253,244,240,0.96),rgba(255,249,243,0.92))] p-7 text-left text-brand-ink">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blush/12 text-brand-blush">
          <AlertCircle size={20} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-brand-night">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#8b5743]">{message}</p>
          {onRetry ? <Button className="mt-5" onClick={onRetry}>Try again</Button> : null}
        </div>
      </div>
    </div>
  );
}
