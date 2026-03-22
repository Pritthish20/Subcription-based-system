import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { DrawPublishInput, DrawSimulationInput } from "@shared/index";
import { Button } from "../../../components/Button";

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
        <Button type="submit" disabled={submitting === "simulate"}>{submitting === "simulate" ? "Running..." : "Simulate draw"}</Button>
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
        <Button type="submit" disabled={submitting === "publish"}>{submitting === "publish" ? "Publishing..." : "Publish results"}</Button>
      </form>
    </section>
  );
}
