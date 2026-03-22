import { Inbox } from "lucide-react";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="surface-panel border-dashed border-slate-300/80 bg-white/55 p-9 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Inbox size={22} />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-brand-night">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{message}</p>
    </div>
  );
}
