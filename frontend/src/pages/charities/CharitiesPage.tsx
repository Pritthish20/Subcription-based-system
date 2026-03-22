import { Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { CharityCard } from "../../components/CharityCard";
import { Panel } from "../../components/Panel";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { useCachedRequest } from "../../lib/hooks/useCachedRequest";
import { useDebouncedValue } from "../../lib/hooks/useDebouncedValue";
import type { Charity } from "../../lib/types/app";

export function CharitiesPage({ initialCharities }: { initialCharities: Charity[] }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const deferredSearch = useDeferredValue(debouncedSearch);
  const query = useMemo(() => deferredSearch.trim(), [deferredSearch]);
  const path = query ? `/charities?search=${encodeURIComponent(query)}` : "/charities";
  const { data: charities, isLoading, error, refresh } = useCachedRequest<Charity[]>({ cacheKey: `charities:${query || "all"}`, path, fallback: initialCharities, staleMs: 45_000, throttleMs: 500 });

  return (
    <main className="space-y-6">
      <Panel tone="strong" className="relative overflow-hidden px-7 py-8 sm:px-9 sm:py-10">
        <div className="grid-overlay absolute inset-0 opacity-20" />
        <div className="relative space-y-5">
          <span className="inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/72">Charity directory</span>
          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl">Explore causes that should feel as important as the game itself.</h1>
          <p className="max-w-3xl text-base leading-7 text-white/72">Search the directory, inspect individual cause profiles, and see which charities are being spotlighted across the platform.</p>
          <div className="relative max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/55" size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by charity or category" className="rounded-full border-white/12 bg-white/10 pl-11 text-white placeholder:text-white/45 focus:border-white/28 focus:bg-white/14" />
          </div>
        </div>
      </Panel>

      {isLoading && !charities.length ? <LoadingState label="Loading charities" /> : null}
      {error && !charities.length ? <ErrorState message={error} onRetry={() => void refresh(true)} /> : null}
      {!isLoading && !error && charities.length === 0 ? <EmptyState title="No charities found" message="Try a different keyword or clear the current search." /> : null}

      <section className="grid gap-5 lg:grid-cols-2">
        {charities.map((charity) => <CharityCard key={charity._id} charity={charity} tall />)}
      </section>
    </main>
  );
}
