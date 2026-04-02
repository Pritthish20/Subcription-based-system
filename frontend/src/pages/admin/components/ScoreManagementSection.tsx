import { useMemo, useState } from "react";
import { Button, GhostButton, SecondaryButton } from "../../../components/Button";
import { Panel } from "../../../components/Panel";
import { DetailModal } from "../../../components/ui/DetailModal";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import type { AdminScore, ScoreDraft } from "../types";
import { InfoPill } from "./InfoPill";

const PREVIEW_COUNT = 3;

const scoreCardClass = (selected: boolean) => `w-full rounded-2xl border px-4 py-4 text-left transition ${selected ? "border-[#d8ba82] bg-[#f5eadc] shadow-[0_16px_32px_rgba(15,18,15,0.14)] dark:border-[#d8ba82] dark:bg-[#efe4d6]" : "border-[#decfbc] bg-[#efe7dc] hover:border-[#d6b98a] hover:bg-[#f7eee2] dark:border-[#d6c4ad] dark:bg-[#e8dfd2] dark:hover:border-[#d8ba82] dark:hover:bg-[#f2e8dc]"}`;

export function ScoreManagementSection({ scores, scoresError, onRetry, selectedScoreId, scoreDraft, setScoreDraft, onSelectScore, onSaveScore, onClearSelection, savingScoreId }: { scores: AdminScore[]; scoresError: string | null; onRetry: () => void; selectedScoreId: string | null; scoreDraft: ScoreDraft | null; setScoreDraft: React.Dispatch<React.SetStateAction<ScoreDraft | null>>; onSelectScore: (score: AdminScore) => void; onSaveScore: () => void; onClearSelection: () => void; savingScoreId: string | null }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const previewScores = useMemo(() => scores.slice(0, PREVIEW_COUNT), [scores]);
  const selectedScore = useMemo(() => scores.find((entry) => entry._id === selectedScoreId) ?? null, [scores, selectedScoreId]);

  function openWithSelection(score?: AdminScore) {
    if (score) onSelectScore(score);
    setIsModalOpen(true);
  }

  return (
    <>
      <Panel className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-brand-ink">Score corrections</h2>
            <p className="mt-1 text-sm muted-copy">Keep only the newest score entries on the dashboard, then open the full correction list when you need to edit a record.</p>
          </div>
          {scores.length ? <SecondaryButton type="button" size="sm" onClick={() => openWithSelection()}>Open full list</SecondaryButton> : null}
        </div>
        {scoresError && !scores.length ? <ErrorState message={scoresError} onRetry={onRetry} /> : null}
        {selectedScore ? (
          <div className="rounded-2xl border border-[#314432] bg-[#162118] px-4 py-3 text-sm text-[#f5eadc] shadow-[0_16px_35px_rgba(8,12,8,0.18)]">
            <span className="font-semibold">Current selection:</span> {selectedScore.userId?.fullName ?? "Unknown player"} / {selectedScore.score} pts
          </div>
        ) : null}
        <div className="space-y-3">
          {previewScores.length ? previewScores.map((score) => (
            <button key={score._id} type="button" onClick={() => openWithSelection(score)} className={scoreCardClass(selectedScoreId === score._id)}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#2b241d]">{score.userId?.fullName ?? "Unknown player"}</span>
                <InfoPill>{score.score} pts</InfoPill>
              </div>
              <p className="mt-1 text-sm text-[#8b7762]">{score.userId?.email ?? "No email"}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#b59f86]">Played {new Date(score.playedAt).toLocaleDateString()}</p>
            </button>
          )) : <EmptyState title="No scores yet" message="Entered scores will show up here for admin correction and auditing." />}
        </div>
        {scores.length > PREVIEW_COUNT ? <p className="text-sm muted-copy">Showing the latest {PREVIEW_COUNT} scores here. Open the full list for deeper score review and edits.</p> : null}
      </Panel>

      <DetailModal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Score corrections" description="Review the complete score ledger and update the selected entry without making the main admin page overly long.">
        {scoresError && !scores.length ? <ErrorState message={scoresError} onRetry={onRetry} /> : null}
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-3">
            {scores.length ? scores.map((score) => (
              <button key={score._id} type="button" onClick={() => onSelectScore(score)} className={scoreCardClass(selectedScoreId === score._id)}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#2b241d]">{score.userId?.fullName ?? "Unknown player"}</span>
                  <InfoPill>{score.score} pts</InfoPill>
                </div>
                <p className="mt-1 text-sm text-[#8b7762]">{score.userId?.email ?? "No email"}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#b59f86]">Played {new Date(score.playedAt).toLocaleDateString()}</p>
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
      </DetailModal>
    </>
  );
}
