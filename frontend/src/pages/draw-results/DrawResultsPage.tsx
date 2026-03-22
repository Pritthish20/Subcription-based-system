import { Panel } from "../../components/Panel";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { currency } from "../../lib";
import { useCachedRequest } from "../../lib/hooks/useCachedRequest";

type DrawResult = {
  _id: string;
  month: string;
  mode: "random" | "weighted";
  officialNumbers?: number[];
  rolloverAmount?: number;
  publishedAt?: string;
  eligibilitySnapshot?: Array<{ userId: string }>;
};

export function DrawResultsPage() {
  const { data: results, isLoading, error, refresh } = useCachedRequest<DrawResult[]>({
    cacheKey: "draws:results",
    path: "/draws/results",
    fallback: [],
    auth: false
  });

  if (isLoading && !results.length) return <LoadingState label="Loading published draws" />;
  if (error && !results.length) return <ErrorState message={error} onRetry={() => void refresh(true)} />;

  return (
    <main className="space-y-6">
      <Panel tone="strong" className="relative overflow-hidden px-7 py-8 sm:px-9 sm:py-10">
        <div className="grid-overlay absolute inset-0 opacity-20" />
        <div className="relative space-y-4">
          <span className="inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/72">Published results</span>
          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl">Official monthly draw history for subscribers, reviewers, and public transparency.</h1>
          <p className="max-w-3xl text-base leading-7 text-white/72">Every published cycle shows the official numbers, the draw mode used, and the rollover carried into the next month.</p>
        </div>
      </Panel>

      {results.length ? (
        <section className="grid gap-5 lg:grid-cols-2">
          {results.map((result) => (
            <Panel key={result._id} className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="eyebrow">{result.mode} draw</span>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-brand-night">{result.month}</h2>
                </div>
                <div className="rounded-[1.4rem] bg-slate-50 px-4 py-3 text-right text-sm text-slate-500">
                  <p>{result.publishedAt ? new Date(result.publishedAt).toLocaleDateString() : "Publish date unavailable"}</p>
                  <p>{result.eligibilitySnapshot?.length ?? 0} eligible subscribers</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {(result.officialNumbers ?? []).map((value) => (
                  <span key={`${result._id}-${value}`} className="inline-flex size-12 items-center justify-center rounded-full bg-brand-night text-sm font-semibold text-white shadow-[0_18px_34px_rgba(17,26,42,0.2)]">{value}</span>
                ))}
              </div>
              <p className="text-sm leading-6 text-slate-600">Rollover after this draw: <span className="font-semibold text-brand-night">{currency(result.rolloverAmount ?? 0)}</span></p>
            </Panel>
          ))}
        </section>
      ) : (
        <EmptyState title="No published draws yet" message="Once the admin publishes a monthly draw, the official result will appear here." />
      )}
    </main>
  );
}
