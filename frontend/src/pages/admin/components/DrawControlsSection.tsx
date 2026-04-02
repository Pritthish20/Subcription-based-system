import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { DrawPublishInput, DrawSimulationInput } from "@shared/index";
import { Button } from "../../../components/Button";

const drawActionClass = "min-w-[12rem] justify-center border-[#d8ba82]/28 bg-[#fff5e8] text-[#1b2a1f] shadow-[0_18px_36px_rgba(15,18,15,0.18)] hover:border-[#d8ba82]/52 hover:bg-[#fffaf3] dark:border-[#d8ba82]/34 dark:bg-[#f5ead8] dark:text-[#172019] dark:hover:border-[#d8ba82]/58 dark:hover:bg-[#fff5e8]";

export function DrawControlsSection({ simulateForm, publishForm, onSimulate, onPublish, submitting }: { simulateForm: UseFormReturn<DrawSimulationInput>; publishForm: UseFormReturn<DrawPublishInput>; onSimulate: FormEventHandler<HTMLFormElement>; onPublish: FormEventHandler<HTMLFormElement>; submitting: "simulate" | "publish" | "charity" | null }) {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <form className="surface-panel space-y-4 p-6" onSubmit={onSimulate}>
        <h2 className="text-2xl font-bold text-brand-ink">Run simulation</h2>
        <label className="grid gap-2 text-sm muted-copy">
          Month
          <input {...simulateForm.register("month")} placeholder="2026-03" />
        </label>
        <label className="grid gap-2 text-sm muted-copy">
          Mode
          <select {...simulateForm.register("mode")}>
            <option value="random">Random</option>
            <option value="weighted">Weighted</option>
          </select>
        </label>
        <Button type="submit" className={drawActionClass} disabled={submitting === "simulate"}>{submitting === "simulate" ? "Running..." : "Simulate draw"}</Button>
      </form>

      <form className="surface-panel space-y-4 p-6" onSubmit={onPublish}>
        <h2 className="text-2xl font-bold text-brand-ink">Publish official draw</h2>
        <label className="grid gap-2 text-sm muted-copy">
          Month
          <input {...publishForm.register("month")} placeholder="2026-03" />
        </label>
        <label className="grid gap-2 text-sm muted-copy">
          Mode
          <select {...publishForm.register("mode")}>
            <option value="random">Random</option>
            <option value="weighted">Weighted</option>
          </select>
        </label>
        <Button type="submit" className={drawActionClass} disabled={submitting === "publish"}>{submitting === "publish" ? "Publishing..." : "Publish results"}</Button>
      </form>
    </section>
  );
}
