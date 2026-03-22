import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  charitySchema,
  drawPublishSchema,
  drawSimulationSchema,
  type CharityInput,
  type DrawPublishInput,
  type DrawSimulationInput
} from "@shared/index";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { clearClientCache, request } from "../../lib";
import { toLocalDateTimeValue } from "../../lib/date";
import { useCachedRequest } from "../../lib/hooks/useCachedRequest";
import type { Charity } from "../../lib/types/app";
import { AdminAnalyticsSection, AdminHero, CharityManagementSection, DrawControlsSection, ScoreManagementSection, SubscriptionManagementSection, UserManagementSection, WinnerQueueSection } from "./components";
import type { AdminDashboard, AdminScore, AdminSubscription, AdminUser, ScoreDraft, SubscriptionDraft, UserDraft, WinnerClaim } from "./types";

const emptyCharity: CharityInput = {
  name: "",
  slug: "",
  description: "",
  category: "",
  featured: false,
  imageUrl: "",
  events: []
};

export function AdminPage() {
  const [submitting, setSubmitting] = useState<"simulate" | "publish" | "charity" | null>(null);
  const [editingCharityId, setEditingCharityId] = useState<string | null>(null);
  const [deletingCharityId, setDeletingCharityId] = useState<string | null>(null);
  const [reviewingClaimId, setReviewingClaimId] = useState<string | null>(null);
  const [payingClaimId, setPayingClaimId] = useState<string | null>(null);
  const [reviewNotesById, setReviewNotesById] = useState<Record<string, string>>({});
  const [payoutReferenceById, setPayoutReferenceById] = useState<Record<string, string>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDraft, setUserDraft] = useState<UserDraft | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [subscriptionDraft, setSubscriptionDraft] = useState<SubscriptionDraft | null>(null);
  const [savingSubscriptionId, setSavingSubscriptionId] = useState<string | null>(null);
  const [selectedScoreId, setSelectedScoreId] = useState<string | null>(null);
  const [scoreDraft, setScoreDraft] = useState<ScoreDraft | null>(null);
  const [savingScoreId, setSavingScoreId] = useState<string | null>(null);

  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError, refresh: refreshDashboard } = useCachedRequest<AdminDashboard>({
    cacheKey: "dashboard:admin",
    path: "/dashboard/admin",
    fallback: {
      totalUsers: 0,
      activeSubscriptions: 0,
      inactiveSubscriptions: 0,
      charities: 0,
      totalPrizePool: 0,
      charityContributionTotals: 0,
      subscriptionDonationTotals: 0,
      independentDonationTotals: 0,
      publishedDraws: 0,
      pendingWinnerClaims: 0,
      approvedWinnerClaims: 0,
      rejectedWinnerClaims: 0,
      totalPayouts: 0,
      paidWinnerClaims: 0,
      avgCharityPercentage: 10,
      notificationStats: { sent: 0, failed: 0, queued: 0, skipped: 0 },
      latestPublishedDraw: null
    },
    useAuth: true
  });
  const { data: users, isLoading: usersLoading, error: usersError, refresh: refreshUsers } = useCachedRequest<AdminUser[]>({ cacheKey: "admin:users", path: "/admin/users", fallback: [], useAuth: true });
  const { data: charities, isLoading: charitiesLoading, error: charitiesError, refresh: refreshCharities } = useCachedRequest<Charity[]>({ cacheKey: "admin:charities", path: "/charities", fallback: [], useAuth: true });
  const { data: winnerClaims, isLoading: winnerClaimsLoading, error: winnerClaimsError, refresh: refreshWinnerClaims } = useCachedRequest<WinnerClaim[]>({ cacheKey: "admin:winner-claims", path: "/admin/winner-claims", fallback: [], useAuth: true });
  const { data: subscriptions, isLoading: subscriptionsLoading, error: subscriptionsError, refresh: refreshSubscriptions } = useCachedRequest<AdminSubscription[]>({ cacheKey: "admin:subscriptions", path: "/admin/subscriptions", fallback: [], useAuth: true });
  const { data: scores, isLoading: scoresLoading, error: scoresError, refresh: refreshScores } = useCachedRequest<AdminScore[]>({ cacheKey: "admin:scores", path: "/admin/scores", fallback: [], useAuth: true });

  const simulateForm = useForm<DrawSimulationInput>({ resolver: zodResolver(drawSimulationSchema), defaultValues: { month: new Date().toISOString().slice(0, 7), mode: "random" } });
  const publishForm = useForm<DrawPublishInput>({ resolver: zodResolver(drawPublishSchema), defaultValues: { month: new Date().toISOString().slice(0, 7), mode: "weighted", numbers: undefined } });
  const charityForm = useForm<CharityInput>({ resolver: zodResolver(charitySchema) as never, defaultValues: emptyCharity });
  const { fields: eventFields, append, remove } = useFieldArray({ control: charityForm.control, name: "events" });

  const hasBlockingError = useMemo(() => {
    const hasAnyData = users.length || charities.length || winnerClaims.length || subscriptions.length || scores.length;
    return !hasAnyData && Boolean(dashboardError || usersError || charitiesError || winnerClaimsError || subscriptionsError || scoresError);
  }, [dashboardError, usersError, charitiesError, winnerClaimsError, subscriptionsError, scoresError, users.length, charities.length, winnerClaims.length, subscriptions.length, scores.length]);

  const featuredCharities = useMemo(() => charities.filter((charity) => charity.featured).length, [charities]);
  const pendingWinnerClaims = useMemo(() => winnerClaims.filter((claim) => claim.reviewStatus === "pending").length, [winnerClaims]);

  async function refreshAdmin() {
    ["dashboard:admin", "admin:users", "admin:charities", "admin:winner-claims", "admin:subscriptions", "admin:scores", "charities"].forEach((key) => clearClientCache(key));
    await Promise.all([refreshDashboard(true), refreshUsers(true), refreshCharities(true), refreshWinnerClaims(true), refreshSubscriptions(true), refreshScores(true)]);
  }

  function resetCharityForm() {
    setEditingCharityId(null);
    charityForm.reset(emptyCharity);
  }

  function startEditCharity(charity: Charity) {
    setEditingCharityId(charity._id);
    charityForm.reset({
      name: charity.name,
      slug: charity.slug,
      description: charity.description,
      category: charity.category,
      featured: charity.featured,
      imageUrl: charity.imageUrl,
      events: charity.events.map((event) => ({ title: event.title, location: event.location, startsAt: new Date(event.startsAt).toISOString() }))
    });
  }

  function selectUser(user: AdminUser) {
    setSelectedUserId(user._id);
    setUserDraft({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accountState: user.accountState,
      charityPercentage: user.charityPercentage,
      selectedCharityId: typeof user.selectedCharityId === "string" ? user.selectedCharityId : user.selectedCharityId?._id ?? ""
    });
  }

  function selectSubscription(subscription: AdminSubscription) {
    setSelectedSubscriptionId(subscription._id);
    setSubscriptionDraft({
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd ? toLocalDateTimeValue(new Date(subscription.currentPeriodEnd)) : "",
      cancellationReason: subscription.cancellationReason ?? ""
    });
  }

  function selectScore(score: AdminScore) {
    setSelectedScoreId(score._id);
    setScoreDraft({
      score: score.score,
      playedAt: toLocalDateTimeValue(new Date(score.playedAt)),
      notes: score.notes ?? ""
    });
  }

  const simulate = simulateForm.handleSubmit(async (values) => {
    try {
      setSubmitting("simulate");
      const result = await request<{ simulatedNumbers: number[] }>("/draws/simulate", { method: "POST", body: JSON.stringify(values) });
      toast.success(`Simulation ready: ${result.simulatedNumbers.join(", ")}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(null);
    }
  });

  const publish = publishForm.handleSubmit(async (values) => {
    try {
      setSubmitting("publish");
      const result = await request<{ draw: { month: string } }>("/draws/publish", { method: "POST", body: JSON.stringify({ ...values, numbers: values.numbers?.filter(Boolean) }) });
      toast.success(`Published ${result.draw.month} draw`);
      await refreshAdmin();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(null);
    }
  });

  const saveCharity = charityForm.handleSubmit(async (values) => {
    try {
      setSubmitting("charity");
      const payload = { ...values, events: values.events.map((event) => ({ ...event, startsAt: new Date(event.startsAt).toISOString() })) };
      if (editingCharityId) {
        await request(`/charities/${editingCharityId}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Charity updated");
      } else {
        await request("/charities", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Charity created");
      }
      resetCharityForm();
      await refreshAdmin();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(null);
    }
  });

  async function deleteCharity(id: string) {
    if (!window.confirm("Delete this charity from the directory?")) return;
    try {
      setDeletingCharityId(id);
      await request(`/charities/${id}`, { method: "DELETE" });
      if (editingCharityId === id) resetCharityForm();
      toast.success("Charity deleted");
      await refreshAdmin();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeletingCharityId(null);
    }
  }

  async function reviewWinnerClaim(claimId: string, status: "approved" | "rejected") {
    try {
      setReviewingClaimId(claimId);
      await request(`/admin/winner-claims/${claimId}/review`, { method: "POST", body: JSON.stringify({ status, adminNotes: reviewNotesById[claimId] || undefined }) });
      toast.success(`Claim ${status}`);
      await refreshAdmin();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setReviewingClaimId(null);
    }
  }

  async function markClaimPaid(claimId: string) {
    const reference = payoutReferenceById[claimId]?.trim();
    if (!reference || reference.length < 2) {
      toast.error("Enter a payout reference first");
      return;
    }
    try {
      setPayingClaimId(claimId);
      await request(`/admin/winner-claims/${claimId}/pay`, { method: "POST", body: JSON.stringify({ reference, paidAt: new Date().toISOString() }) });
      toast.success("Payout marked as completed");
      await refreshAdmin();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPayingClaimId(null);
    }
  }

  async function saveUser() {
    if (!selectedUserId || !userDraft) return;
    try {
      setSavingUserId(selectedUserId);
      await request(`/admin/users/${selectedUserId}`, { method: "PATCH", body: JSON.stringify(userDraft) });
      toast.success("User updated");
      await refreshAdmin();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingUserId(null);
    }
  }

  async function saveSubscription() {
    if (!selectedSubscriptionId || !subscriptionDraft) return;
    try {
      setSavingSubscriptionId(selectedSubscriptionId);
      await request(`/admin/subscriptions/${selectedSubscriptionId}`, { method: "PATCH", body: JSON.stringify({ ...subscriptionDraft, currentPeriodEnd: subscriptionDraft.currentPeriodEnd ? new Date(subscriptionDraft.currentPeriodEnd).toISOString() : "" }) });
      toast.success("Subscription updated");
      await refreshAdmin();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingSubscriptionId(null);
    }
  }

  async function saveScore() {
    if (!selectedScoreId || !scoreDraft) return;
    try {
      setSavingScoreId(selectedScoreId);
      await request(`/admin/scores/${selectedScoreId}`, { method: "PATCH", body: JSON.stringify({ ...scoreDraft, playedAt: new Date(scoreDraft.playedAt).toISOString() }) });
      toast.success("Score updated");
      await refreshAdmin();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingScoreId(null);
    }
  }

  if (dashboardLoading && usersLoading && charitiesLoading && winnerClaimsLoading && subscriptionsLoading && scoresLoading) {
    return <LoadingState label="Loading admin dashboard" />;
  }

  if (hasBlockingError) {
    return <ErrorState message={dashboardError || usersError || charitiesError || winnerClaimsError || subscriptionsError || scoresError || "Failed to load admin data"} onRetry={() => void refreshAdmin()} />;
  }

  return (
    <main className="space-y-6">
      <AdminHero dashboard={dashboard} pendingWinnerClaims={pendingWinnerClaims} />
      <AdminAnalyticsSection dashboard={dashboard} charities={charities} featuredCharities={featuredCharities} />
      <DrawControlsSection simulateForm={simulateForm} publishForm={publishForm} onSimulate={simulate} onPublish={publish} submitting={submitting} />
      <CharityManagementSection charityForm={charityForm} onSubmit={saveCharity} editingCharityId={editingCharityId} onReset={resetCharityForm} submitting={submitting} eventFields={eventFields} getEventStartsAt={(index) => charityForm.watch(`events.${index}.startsAt`)} appendEvent={() => append({ title: "", location: "", startsAt: new Date().toISOString() })} removeEvent={remove} charities={charities} charitiesLoading={charitiesLoading} charitiesError={charitiesError} onRetry={() => void refreshCharities(true)} onEditCharity={startEditCharity} onDeleteCharity={(id) => void deleteCharity(id)} deletingCharityId={deletingCharityId} />
      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <WinnerQueueSection winnerClaims={winnerClaims} winnerClaimsError={winnerClaimsError} onRetry={() => void refreshWinnerClaims(true)} reviewNotesById={reviewNotesById} setReviewNotesById={setReviewNotesById} payoutReferenceById={payoutReferenceById} setPayoutReferenceById={setPayoutReferenceById} onReviewClaim={(claimId, status) => void reviewWinnerClaim(claimId, status)} onMarkPaid={(claimId) => void markClaimPaid(claimId)} reviewingClaimId={reviewingClaimId} payingClaimId={payingClaimId} />
        <UserManagementSection users={users} usersError={usersError} onRetry={() => void refreshUsers(true)} selectedUserId={selectedUserId} userDraft={userDraft} setUserDraft={setUserDraft} onSelectUser={selectUser} onSaveUser={() => void saveUser()} onClearSelection={() => { setSelectedUserId(null); setUserDraft(null); }} savingUserId={savingUserId} charities={charities} />
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <SubscriptionManagementSection subscriptions={subscriptions} subscriptionsError={subscriptionsError} onRetry={() => void refreshSubscriptions(true)} selectedSubscriptionId={selectedSubscriptionId} subscriptionDraft={subscriptionDraft} setSubscriptionDraft={setSubscriptionDraft} onSelectSubscription={selectSubscription} onSaveSubscription={() => void saveSubscription()} onClearSelection={() => { setSelectedSubscriptionId(null); setSubscriptionDraft(null); }} savingSubscriptionId={savingSubscriptionId} />
        <ScoreManagementSection scores={scores} scoresError={scoresError} onRetry={() => void refreshScores(true)} selectedScoreId={selectedScoreId} scoreDraft={scoreDraft} setScoreDraft={setScoreDraft} onSelectScore={selectScore} onSaveScore={() => void saveScore()} onClearSelection={() => { setSelectedScoreId(null); setScoreDraft(null); }} savingScoreId={savingScoreId} />
      </section>
    </main>
  );
}




