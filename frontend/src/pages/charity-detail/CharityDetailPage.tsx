import { ArrowLeft, CalendarRange, HeartHandshake } from "lucide-react";
import { useMemo } from "react";
import { NavLink, useParams } from "react-router-dom";
import { Panel } from "../../components/Panel";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { useCachedRequest } from "../../lib/hooks/useCachedRequest";
import type { Charity } from "../../lib/types/app";

export function CharityDetailPage({ charities }: { charities: Charity[] }) {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const fallback = useMemo(() => charities.find((charity) => charity.slug === slug) ?? null, [charities, slug]);
  const { data: charity, isLoading, error, refresh } = useCachedRequest<Charity | null>({
    cacheKey: `charity:${slug}`,
    path: `/charities/${slug}`,
    fallback,
    enabled: Boolean(slug),
    staleMs: 45_000,
    auth: false
  });

  if (isLoading && !charity) return <LoadingState label="Loading charity" />;
  if (error && !charity) return <ErrorState message={error} onRetry={() => void refresh(true)} />;
  if (!charity) return <EmptyState title="Charity not found" message="This charity profile could not be loaded. Try the directory instead." />;

  return (
    <main className="space-y-6">
      <section className="surface-panel overflow-hidden p-0">
        <div className="relative">
          <img src={charity.imageUrl} alt={charity.name} className="h-80 w-full object-cover sm:h-[26rem]" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-night via-brand-night/28 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-9">
            <span className="inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/72">Charity profile</span>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl">{charity.name}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-white/74">{charity.description}</p>
          </div>
        </div>

        <div className="grid gap-6 p-7 lg:grid-cols-[1.02fr_0.98fr] lg:p-9">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-slate-50/90 p-5">
                <div className="flex items-center gap-2 text-brand-night"><HeartHandshake size={18} /><span className="font-semibold">Cause category</span></div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{charity.category}</p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50/90 p-5">
                <div className="flex items-center gap-2 text-brand-night"><CalendarRange size={18} /><span className="font-semibold">Events listed</span></div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{charity.events.length} upcoming event{charity.events.length === 1 ? "" : "s"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <NavLink to="/auth" className="inline-flex rounded-full bg-brand-night px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0c1320]">Support this charity</NavLink>
              <NavLink to="/charities" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-brand-night transition hover:bg-slate-50"><ArrowLeft size={16} /> Back to directory</NavLink>
            </div>
          </div>

          <Panel tone="soft" className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-night">Upcoming events</h2>
            {charity.events.length ? (
              <ul className="space-y-3 text-sm text-slate-600">
                {charity.events.map((event) => (
                  <li key={`${event.title}-${event.startsAt}`} className="rounded-[1.4rem] border border-slate-200/70 bg-white px-4 py-4">
                    <p className="font-semibold text-brand-night">{event.title}</p>
                    <p className="mt-1">{event.location}</p>
                    <p className="mt-2 text-slate-500">{new Date(event.startsAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No events announced" message="The cause profile is live, but golf days or fundraising events have not been published yet." />
            )}
          </Panel>
        </div>
      </section>
    </main>
  );
}
