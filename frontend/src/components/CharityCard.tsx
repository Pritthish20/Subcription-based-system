import { ArrowUpRight, CalendarClock, HeartHandshake } from "lucide-react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import type { Charity } from "../lib/types/app";

export function CharityCard({ charity, tall = false }: { charity: Charity; tall?: boolean }) {
  return (
    <motion.article
      whileHover={{ y: -6 }}
      className="group surface-panel overflow-hidden"
    >
      <div className="relative overflow-hidden">
        <img src={charity.imageUrl} alt={charity.name} className={`w-full object-cover transition duration-500 group-hover:scale-[1.03] ${tall ? "h-64 sm:h-72" : "h-56"}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-night/78 via-brand-night/20 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/72">{charity.category}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-[1.9rem]">{charity.name}</h2>
          </div>
          {charity.featured ? <span className="rounded-full border border-white/18 bg-white/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em]">Spotlight</span> : null}
        </div>
      </div>

      <div className="space-y-4 p-6">
        <p className="text-sm leading-7 text-slate-600">{charity.description}</p>
        <div className="grid gap-3 text-sm text-slate-500 sm:grid-cols-2">
          <div className="rounded-[1.3rem] bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-2 text-brand-night"><HeartHandshake size={16} /><span className="font-semibold">Cause focus</span></div>
            <p className="mt-2">{charity.category}</p>
          </div>
          <div className="rounded-[1.3rem] bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-2 text-brand-night"><CalendarClock size={16} /><span className="font-semibold">Upcoming</span></div>
            <p className="mt-2">{charity.events.length ? `${charity.events.length} listed event${charity.events.length === 1 ? "" : "s"}` : "No events yet"}</p>
          </div>
        </div>
        {tall && charity.events.length ? (
          <ul className="space-y-2 text-sm text-slate-500">
            {charity.events.slice(0, 3).map((event) => <li key={event.title} className="rounded-2xl bg-slate-50/80 px-4 py-3">{event.title} · {event.location}</li>)}
          </ul>
        ) : null}
        <NavLink to={`/charities/${charity.slug}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-night transition hover:border-brand-night/20 hover:bg-slate-50">
          View charity <ArrowUpRight size={16} />
        </NavLink>
      </div>
    </motion.article>
  );
}
