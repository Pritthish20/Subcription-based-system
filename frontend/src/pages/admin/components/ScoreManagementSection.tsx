import { Button, GhostButton } from "../../../components/Button";
import { Panel } from "../../../components/Panel";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import type { AdminScore, ScoreDraft } from "../types";
import { InfoPill } from "./InfoPill";

export function ScoreManagementSection({ scores, scoresError, onRetry, selectedScoreId, scoreDraft, setScoreDraft, onSelectScore, onSaveScore, onClearSelection, savingScoreId }: { scores: AdminScore[]; scoresError: string | null; onRetry: () => void; selectedScoreId: string | null; scoreDraft: ScoreDraft | null; setScoreDraft: React.Dispatch<React.SetStateAction<ScoreDraft | null>>; onSelectScore: (score: AdminScore) => void; onSaveScore: () => void; onClearSelection: () => void; savingScoreId: string | null }) {
  return (
    <Panel className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-ink">Score corrections</h2>
        <p className="mt-1 text-sm muted-copy">Fix submitted Stableford scores, dates, and score notes.</p>
      </div>
      {scoresError && !scores.length ? <ErrorState message={scoresError} onRetry={onRetry} /> : null}
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          {scores.length ? scores.slice(0, 12).map((score) => (
            <button key={score._id} type="button" onClick={() => onSelectScore(score)} className={`w-full rounded-2xl border px-4 py-4 text-left transition ${selectedScoreId === score._id ? "border-brand-emerald/36 bg-brand-emerald/12" : "border-[#eadbc8]/80 bg-[#fff8ef]/56 hover:bg-[#fffdf8]"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-brand-ink">{score.userId?.fullName ?? "Unknown player"}</span>
                <InfoPill>{score.score} pts</InfoPill>
              </div>
              <p className="mt-1 text-sm muted-copy">{score.userId?.email ?? "No email"}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] muted-copy">Played {new Date(score.playedAt).toLocaleDateString()}</p>
            </button>
          )) : <EmptyState title="No scores yet" message="Entered scores will show up here for admin correction and auditing." />}
        </div>

        <div className="surface-soft p-5">
          {scoreDraft ? (
            <div className="space-y-4">
              <label className="grid gap-2 text-sm muted-copy">Stableford score<input type="number" min={1} max={45} value={scoreDraft.score} onChange={(event) => setScoreDraft((current) => current ? { ...current, score: Number(event.target.value) || 1 } : current)} /></label>
              <label className="grid gap-2 text-sm muted-copy">Played at<input type="datetime-local" value={scoreDraft.playedAt} onChange={(event) => setScoreDraft((current) => current ? { ...current, playedAt: event.target.value } : current)} /></label>
              <label className="grid gap-2 text-sm muted-copy">Notes<textarea className="min-h-28" value={scoreDraft.notes} onChange={(event) => setScoreDraft((current) => current ? { ...current, notes: event.target.value } : current)} /></label>
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={onSaveScore} disabled={savingScoreId === selectedScoreId}>{savingScoreId === selectedScoreId ? "Saving..." : "Save score"}</Button>
                <GhostButton type="button" onClick={onClearSelection}>Clear selection</GhostButton>
              </div>
            </div>
          ) : (
            <EmptyState title="Select a score" message="Choose a score entry to adjust points, timestamp, or notes." />
          )}
        </div>
      </div>
    </Panel>
  );
}
