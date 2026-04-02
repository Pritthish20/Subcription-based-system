import { useMemo, useState } from "react";
import { Button, GhostButton, SecondaryButton } from "../../../components/Button";
import { Panel } from "../../../components/Panel";
import { DetailModal } from "../../../components/ui/DetailModal";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import type { Charity } from "../../../lib/types/app";
import type { AdminUser, UserDraft } from "../types";
import { InfoPill } from "./InfoPill";

const PREVIEW_COUNT = 3;

const userCardClass = (selected: boolean) => `w-full rounded-2xl border px-4 py-4 text-left transition ${selected ? "border-[#d8ba82] bg-[#f5eadc] shadow-[0_16px_32px_rgba(15,18,15,0.14)] dark:border-[#d8ba82] dark:bg-[#efe4d6]" : "border-[#decfbc] bg-[#efe7dc] hover:border-[#d6b98a] hover:bg-[#f7eee2] dark:border-[#d6c4ad] dark:bg-[#e8dfd2] dark:hover:border-[#d8ba82] dark:hover:bg-[#f2e8dc]"}`;

export function UserManagementSection({ users, usersError, onRetry, selectedUserId, userDraft, setUserDraft, onSelectUser, onSaveUser, onClearSelection, savingUserId, charities }: { users: AdminUser[]; usersError: string | null; onRetry: () => void; selectedUserId: string | null; userDraft: UserDraft | null; setUserDraft: React.Dispatch<React.SetStateAction<UserDraft | null>>; onSelectUser: (user: AdminUser) => void; onSaveUser: () => void; onClearSelection: () => void; savingUserId: string | null; charities: Charity[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const previewUsers = useMemo(() => users.slice(0, PREVIEW_COUNT), [users]);
  const selectedUser = useMemo(() => users.find((entry) => entry._id === selectedUserId) ?? null, [users, selectedUserId]);

  function openWithSelection(user?: AdminUser) {
    if (user) onSelectUser(user);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  return (
    <>
      <Panel className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-brand-ink">Subscriber management</h2>
            <p className="mt-1 text-sm muted-copy">Keep the dashboard light here, then open the full editable list when you need account-level changes.</p>
          </div>
          {users.length ? <SecondaryButton type="button" size="sm" onClick={() => openWithSelection()}>Open full list</SecondaryButton> : null}
        </div>
        {usersError && !users.length ? <ErrorState message={usersError} onRetry={onRetry} /> : null}
        {selectedUser ? (
          <div className="rounded-2xl border border-[#314432] bg-[#162118] px-4 py-3 text-sm text-[#f5eadc] shadow-[0_16px_35px_rgba(8,12,8,0.18)]">
            <span className="font-semibold">Current selection:</span> {selectedUser.fullName}
          </div>
        ) : null}
        <div className="space-y-3">
          {previewUsers.length ? previewUsers.map((user) => {
            const charityName = typeof user.selectedCharityId === "string" ? charities.find((entry) => entry._id === user.selectedCharityId)?.name : user.selectedCharityId?.name;
            return (
              <button key={user._id} type="button" onClick={() => openWithSelection(user)} className={userCardClass(selectedUserId === user._id)}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#2b241d]">{user.fullName}</span>
                  <InfoPill>{user.role}</InfoPill>
                </div>
                <p className="mt-1 text-sm text-[#8b7762]">{user.email}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#b59f86]">{user.accountState} - Charity {charityName ?? "Unassigned"}</p>
              </button>
            );
          }) : <EmptyState title="No users yet" message="New subscribers and admins will appear here once the platform is active." />}
        </div>
        {users.length > PREVIEW_COUNT ? <p className="text-sm muted-copy">Showing the latest {PREVIEW_COUNT} users here. Open the full list for the full roster and editing tools.</p> : null}
      </Panel>

      <DetailModal open={isModalOpen} onClose={closeModal} title="Subscriber management" description="Review the full subscriber/admin roster and edit account details without stretching the main admin page.">
        {usersError && !users.length ? <ErrorState message={usersError} onRetry={onRetry} /> : null}
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-3">
            {users.length ? users.map((user) => {
              const charityName = typeof user.selectedCharityId === "string" ? charities.find((entry) => entry._id === user.selectedCharityId)?.name : user.selectedCharityId?.name;
              return (
                <button key={user._id} type="button" onClick={() => onSelectUser(user)} className={userCardClass(selectedUserId === user._id)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#2b241d]">{user.fullName}</span>
                    <InfoPill>{user.role}</InfoPill>
                  </div>
                  <p className="mt-1 text-sm text-[#8b7762]">{user.email}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#b59f86]">{user.accountState} - Charity {charityName ?? "Unassigned"}</p>
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
      </DetailModal>
    </>
  );
}
