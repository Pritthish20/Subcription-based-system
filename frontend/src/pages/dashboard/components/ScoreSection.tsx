import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ScoreInput } from "@shared/index";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Panel } from "../../../components/Panel";
import { toLocalDateTimeValue } from "../../../lib/date";
import type { DashboardScore } from "../types";

export function ScoreSection({ form, onSubmit, hasActiveSubscription, scores }: { form: UseFormReturn<ScoreInput>; onSubmit: FormEventHandler<HTMLFormElement>; hasActiveSubscription: boolean; scores: DashboardScore[] }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[0.96fr_1.04fr]">
      <form className="surface-panel space-y-4 p-6" onSubmit={onSubmit}>
        <h2 className="text-2xl font-bold text-brand-ink">Enter score</h2>
        <label className="grid gap-2 text-sm muted-copy">
          Stableford score
          <input {...form.register("score", { valueAsNumber: true })} type="number" min={1} max={45} disabled={!hasActiveSubscription} />
        </label>
        <label className="grid gap-2 text-sm muted-copy">
          Played at
          <input type="datetime-local" value={toLocalDateTimeValue(new Date(form.watch("playedAt") || new Date().toISOString()))} onChange={(event) => form.setValue("playedAt", new Date(event.target.value).toISOString(), { shouldValidate: true })} disabled={!hasActiveSubscription} />
        </label>
        <label className="grid gap-2 text-sm muted-copy">
          Notes
          <input {...form.register("notes")} disabled={!hasActiveSubscription} />
        </label>
        <Button type="submit" disabled={!hasActiveSubscription}>Save score</Button>
      </form>

      <Panel className="space-y-4">
        <h2 className="text-2xl font-bold text-brand-ink">Latest scores</h2>
        {scores.length ? (
          <ul className="space-y-3 text-sm muted-copy">
            {scores.map((score) => (
              <li key={score._id} className="theme-card rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-brand-ink">{score.score} pts</span>
                  <span>{new Date(score.playedAt).toLocaleDateString()}</span>
                </div>
                {score.notes ? <p className="mt-2 muted-copy">{score.notes}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No scores yet" message={hasActiveSubscription ? "Add your latest Stableford rounds to become draw-ready." : "Activate your subscription to unlock score entry and draw participation."} />
        )}
      </Panel>
    </section>
  );
}
