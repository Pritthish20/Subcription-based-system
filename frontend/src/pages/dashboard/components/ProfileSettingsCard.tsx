import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { UpdateProfileInput } from "@shared/index";
import { Button } from "../../../components/Button";
import type { Charity } from "../../../lib/types/app";

export function ProfileSettingsCard({ charities, form, onSubmit }: { charities: Charity[]; form: UseFormReturn<UpdateProfileInput>; onSubmit: FormEventHandler<HTMLFormElement> }) {
  return (
    <form className="surface-panel space-y-4 p-6" onSubmit={onSubmit}>
      <div>
        <h2 className="text-2xl font-bold text-brand-ink">Profile and charity settings</h2>
        <p className="mt-1 text-sm muted-copy">Update your public name, chosen charity, and contribution percentage.</p>
      </div>
      <label className="grid gap-2 text-sm muted-copy">
        Full name
        <input {...form.register("fullName")} />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm muted-copy">
          Selected charity
          <select {...form.register("selectedCharityId")}>
            <option value="">Choose charity</option>
            {charities.map((charity) => <option key={charity._id} value={charity._id}>{charity.name}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm muted-copy">
          Charity percentage
          <input type="number" min={10} max={100} {...form.register("charityPercentage", { valueAsNumber: true })} />
        </label>
      </div>
      <Button type="submit">Save settings</Button>
    </form>
  );
}
