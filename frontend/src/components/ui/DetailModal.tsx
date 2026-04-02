import { useEffect, type PropsWithChildren, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { GhostButton } from "../Button";

export function DetailModal({
  open,
  title,
  description,
  onClose,
  children,
  footer
}: PropsWithChildren<{
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
}>) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[rgba(12,16,12,0.62)] backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-[#d7c6af] bg-[#fff7ee] shadow-[0_28px_80px_rgba(12,16,12,0.36)] dark:border-[#314432] dark:bg-[#142016]">
        <div className="flex items-start justify-between gap-4 border-b border-[#e4d5c1] px-6 py-5 dark:border-[#263727]">
          <div>
            <h2 className="text-2xl font-bold text-brand-ink">{title}</h2>
            {description ? <p className="mt-1 text-sm muted-copy">{description}</p> : null}
          </div>
          <GhostButton type="button" size="sm" onClick={onClose} className="shrink-0">
            Close
          </GhostButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-[#e4d5c1] px-6 py-4 dark:border-[#263727]">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
