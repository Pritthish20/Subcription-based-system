import { Button, GhostButton } from "../../../components/Button";
import { Panel } from "../../../components/Panel";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import type { Charity } from "../../../lib/types/app";
import type { AdminUser, UserDraft } from "../types";
import { InfoPill } from "./InfoPill";

export function UserManagementSection({ users, usersError, onRetry, selectedUserId, userDraft, setUserDraft, onSelectUser, onSaveUser, onClearSelection, savingUserId, charities }: { users: AdminUser[]; usersError: string | null; onRetry: () => void; selectedUserId: string | null; userDraft: UserDraft | null; setUserDraft: React.Dispatch<React.SetStateAction<UserDraft | null>>; onSelectUser: (user: AdminUser) => void; onSaveUser: () => void; onClearSelection: () => void; savingUserId: string | null; charities: Charity[] }) {
  return (
    <Panel className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-ink">Subscriber management</h2>
        <p className="mt-1 text-sm muted-copy">Update account state, role, charity allocation, and email details.</p>
      </div>
      {usersError && !users.length ? <ErrorState message={usersError} onRetry={onRetry} /> : null}
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          {users.length ? users.slice(0, 12).map((user) => {
            const charityName = typeof user.selectedCharityId === "string" ? charities.find((entry) => entry._id === user.selectedCharityId)?.name : user.selectedCharityId?.name;
            return (
              <button key={user._id} type="button" onClick={() => onSelectUser(user)} className={`w-full rounded-2xl border px-4 py-4 text-left transition ${selectedUserId === user._id ? "border-brand-emerald/36 bg-brand-emerald/12" : "border-[#eadbc8]/80 bg-[#fff8ef]/56 hover:bg-[#fffdf8]"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-brand-ink">{user.fullName}</span>
                  <InfoPill>{user.role}</InfoPill>
                </div>
                <p className="mt-1 text-sm muted-copy">{user.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] muted-copy">{user.accountState} - Charity {charityName ?? "Unassigned"}</p>
              </button>
            );
          }) : <EmptyState title="No users yet" message="New subscribers and admins will appear here once the platform is active." />}
        </div>

        <div className="surface-soft p-5">
          {userDraft ? (
            <div className="space-y-4">
              <label className="grid gap-2 text-sm muted-copy">Full name<input value={userDraft.fullName} onChange={(event) => setUserDraft((current) => current ? { ...current, fullName: event.target.value } : current)} /></label>
              <label className="grid gap-2 text-sm muted-copy">Email<input type="email" value={userDraft.email} onChange={(event) => setUserDraft((current) => current ? { ...current, email: event.target.value } : current)} /></label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm muted-copy">Role<select value={userDraft.role} onChange={(event) => setUserDraft((current) => current ? { ...current, role: event.target.value as UserDraft["role"] } : current)}><option value="subscriber">Subscriber</option><option value="admin">Admin</option></select></label>
                <label className="grid gap-2 text-sm muted-copy">Account state<select value={userDraft.accountState} onChange={(event) => setUserDraft((current) => current ? { ...current, accountState: event.target.value as UserDraft["accountState"] } : current)}><option value="pending">Pending</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm muted-copy">Charity percentage<input type="number" min={10} max={100} value={userDraft.charityPercentage} onChange={(event) => setUserDraft((current) => current ? { ...current, charityPercentage: Number(event.target.value) || 10 } : current)} /></label>
                <label className="grid gap-2 text-sm muted-copy">Selected charity<select value={userDraft.selectedCharityId} onChange={(event) => setUserDraft((current) => current ? { ...current, selectedCharityId: event.target.value } : current)}><option value="">Choose charity</option>{charities.map((charity) => <option key={charity._id} value={charity._id}>{charity.name}</option>)}</select></label>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={onSaveUser} disabled={savingUserId === selectedUserId}>{savingUserId === selectedUserId ? "Saving..." : "Save user"}</Button>
                <GhostButton type="button" onClick={onClearSelection}>Clear selection</GhostButton>
              </div>
            </div>
          ) : (
            <EmptyState title="Select a user" message="Choose a subscriber or admin from the list to edit their account details." />
          )}
        </div>
      </div>
    </Panel>
  );
}
