import { Inbox } from "lucide-react";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="surface-panel border-dashed border-[#dccab5] bg-[#fff7ee]/72 p-9 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#efe3d2] text-[#8a755d]">
        <Inbox size={22} />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-brand-night">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#7b6a58]">{message}</p>
    </div>
  );
}
