import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { CharityInput } from "@shared/index";
import { Button, GhostButton, SecondaryButton } from "../../../components/Button";
import { Panel } from "../../../components/Panel";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { toLocalDateTimeValue } from "../../../lib/date";
import type { Charity } from "../../../lib/types/app";
import { InfoPill } from "./InfoPill";

export function CharityManagementSection({ charityForm, onSubmit, editingCharityId, onReset, submitting, eventFields, getEventStartsAt, appendEvent, removeEvent, charities, charitiesLoading, charitiesError, onRetry, onEditCharity, onDeleteCharity, deletingCharityId }: { charityForm: UseFormReturn<CharityInput>; onSubmit: FormEventHandler<HTMLFormElement>; editingCharityId: string | null; onReset: () => void; submitting: "simulate" | "publish" | "charity" | null; eventFields: Array<{ id: string }>; getEventStartsAt: (index: number) => string | undefined; appendEvent: () => void; removeEvent: (index: number) => void; charities: Charity[]; charitiesLoading: boolean; charitiesError: string | null; onRetry: () => void; onEditCharity: (charity: Charity) => void; onDeleteCharity: (id: string) => void; deletingCharityId: string | null }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <form className="surface-panel space-y-4 p-6" onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-ink">{editingCharityId ? "Edit charity" : "Create charity"}</h2>
            <p className="mt-1 text-sm muted-copy">Manage spotlight charities, media, and upcoming event content.</p>
          </div>
          {editingCharityId ? <SecondaryButton type="button" onClick={onReset}>Clear form</SecondaryButton> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm muted-copy">Name<input {...charityForm.register("name")} /></label>
          <label className="grid gap-2 text-sm muted-copy">Slug<input {...charityForm.register("slug")} /></label>
          <label className="grid gap-2 text-sm muted-copy">Category<input {...charityForm.register("category")} /></label>
          <label className="grid gap-2 text-sm muted-copy">Image URL<input {...charityForm.register("imageUrl")} type="url" /></label>
        </div>

        <label className="surface-soft flex items-center gap-3 px-4 py-3 text-sm muted-copy">
          <input type="checkbox" className="size-4 accent-slate-900" {...charityForm.register("featured")} />
          Mark as featured charity
        </label>

        <label className="grid gap-2 text-sm muted-copy">
          Description
          <textarea className="min-h-36" {...charityForm.register("description")} />
        </label>

        <div className="surface-soft space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-brand-ink">Events</h3>
            <GhostButton type="button" onClick={appendEvent}>Add event</GhostButton>
          </div>
          {eventFields.length ? (
            eventFields.map((field, index) => {
              const startsAtValue = getEventStartsAt(index);
              return (
                <div key={field.id} className="grid gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm muted-copy">Title<input {...charityForm.register(`events.${index}.title`)} /></label>
                  <label className="grid gap-2 text-sm muted-copy">Location<input {...charityForm.register(`events.${index}.location`)} /></label>
                  <input type="hidden" {...charityForm.register(`events.${index}.startsAt`)} />
                  <label className="grid gap-2 text-sm muted-copy md:col-span-2">
                    Starts at
                    <input type="datetime-local" value={startsAtValue ? toLocalDateTimeValue(new Date(startsAtValue)) : toLocalDateTimeValue()} onChange={(event) => charityForm.setValue(`events.${index}.startsAt`, new Date(event.target.value).toISOString(), { shouldValidate: true })} />
                  </label>
                  <div className="md:col-span-2"><GhostButton type="button" onClick={() => removeEvent(index)}>Remove event</GhostButton></div>
                </div>
              );
            })
          ) : (
            <EmptyState title="No events added" message="Upcoming golf days and charity events can be added here for the public directory." />
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={submitting === "charity"}>{submitting === "charity" ? (editingCharityId ? "Saving..." : "Creating...") : (editingCharityId ? "Save charity" : "Create charity")}</Button>
          {editingCharityId ? <GhostButton type="button" onClick={onReset}>Cancel edit</GhostButton> : null}
        </div>
      </form>

      <Panel className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-brand-ink">Charity directory</h2>
            <p className="mt-1 text-sm muted-copy">Review featured flags, content coverage, and event counts.</p>
          </div>
          {charitiesLoading ? <span className="text-sm muted-copy">Refreshing...</span> : null}
        </div>
        {charitiesError && !charities.length ? <ErrorState message={charitiesError} onRetry={onRetry} /> : null}
        {charities.length ? (
          <ul className="space-y-3 text-sm muted-copy">
            {charities.map((charity) => (
              <li key={charity._id} className="theme-card rounded-2xl px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-brand-ink">{charity.name}</span>
                      {charity.featured ? <InfoPill>Featured</InfoPill> : null}
                    </div>
                    <p>{charity.category} - {charity.events.length} event{charity.events.length === 1 ? "" : "s"}</p>
                    <p className="line-clamp-2 muted-copy">{charity.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <GhostButton type="button" onClick={() => onEditCharity(charity)}>Edit</GhostButton>
                    <SecondaryButton type="button" onClick={() => onDeleteCharity(charity._id)} disabled={deletingCharityId === charity._id}>{deletingCharityId === charity._id ? "Deleting..." : "Delete"}</SecondaryButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No charities yet" message="Create the first charity entry to populate the public directory." />
        )}
      </Panel>
    </section>
  );
}
