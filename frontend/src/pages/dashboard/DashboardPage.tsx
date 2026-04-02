import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  cancelSubscriptionSchema,
  checkoutSchema,
  oneTimeDonationSchema,
  scoreSchema,
  updateProfileSchema,
  winnerProofSchema,
  type CancelSubscriptionInput,
  type CheckoutInput,
  type OneTimeDonationInput,
  type ScoreInput,
  type UpdateProfileInput,
  type WinnerProofInput
} from "@shared/index";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import {
  clearClientCache,
  loadRazorpayCheckout,
  request,
  type RazorpayDonationCheckout,
  type RazorpaySubscriptionCheckout,
  uploadWinnerProof
} from "../../lib";
import { useCachedRequest } from "../../lib/hooks/useCachedRequest";
import type { Charity, Plan } from "../../lib/types/app";
import { DashboardHero, DonationWinningsSection, ProfileSettingsCard, ProofParticipationSection, ScoreSection, SubscriptionControlCard } from "./components";
import type { DashboardSummary } from "./types";

type SubscriptionCheckoutResponse = {
  checkoutUrl?: string;
  message?: string;
  mode?: "razorpay";
  checkout?: RazorpaySubscriptionCheckout;
};

type DonationCheckoutResponse = {
  checkoutUrl?: string;
  message?: string;
  mode?: "razorpay";
  checkout?: RazorpayDonationCheckout;
};

const emptyDashboardSummary: DashboardSummary = {
  user: null,
  subscription: null,
  scores: [],
  claims: [],
  drawsEntered: 0,
  winningsTotal: 0,
  upcomingDraw: null
};

export function DashboardPage({ charities }: { charities: Charity[] }) {
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading">("idle");
  const [selectedClaimId, setSelectedClaimId] = useState("");

  const { data: summary, isLoading, error, refresh } = useCachedRequest<DashboardSummary>({
    cacheKey: "dashboard:subscriber",
    path: "/dashboard/subscriber",
    fallback: emptyDashboardSummary, useAuth: true
  });

  const { data: plans, isLoading: plansLoading, error: plansError, refresh: refreshPlans } = useCachedRequest<Plan[]>({
    cacheKey: "billing:plans",
    path: "/billing/plans",
    fallback: [], useAuth: false
  });

  const scoreForm = useForm<ScoreInput>({ resolver: zodResolver(scoreSchema), defaultValues: { score: 32, playedAt: new Date().toISOString(), notes: "" } });
  const checkoutForm = useForm<CheckoutInput>({ resolver: zodResolver(checkoutSchema), defaultValues: { planId: "", successUrl: `${window.location.origin}/dashboard`, cancelUrl: `${window.location.origin}/dashboard` } });
  const profileForm = useForm<UpdateProfileInput>({ resolver: zodResolver(updateProfileSchema), defaultValues: { fullName: "", charityPercentage: 10, selectedCharityId: "" } });
  const donationForm = useForm<OneTimeDonationInput>({ resolver: zodResolver(oneTimeDonationSchema), defaultValues: { charityId: "", amount: 1000, message: "", successUrl: `${window.location.origin}/dashboard`, cancelUrl: `${window.location.origin}/dashboard` } });
  const cancelForm = useForm<CancelSubscriptionInput>({ resolver: zodResolver(cancelSubscriptionSchema), defaultValues: { reason: "" } });
  const proofForm = useForm<WinnerProofInput>({ resolver: zodResolver(winnerProofSchema), defaultValues: { proofUrl: "", notes: "" } });

  const selectedCharity = useMemo(() => {
    const charityId = summary?.user?.selectedCharityId && typeof summary.user.selectedCharityId === "object" ? summary.user.selectedCharityId._id : summary?.user?.selectedCharityId;
    return charities.find((charity) => charity._id === charityId) ?? null;
  }, [charities, summary]);

  const subscriptionStatus = summary?.subscription?.status ?? "inactive";
  const subscriptionEndsAt = summary?.subscription?.currentPeriodEnd ? new Date(summary.subscription.currentPeriodEnd) : null;
  const hasActiveSubscription = subscriptionStatus === "active" && (!subscriptionEndsAt || subscriptionEndsAt.getTime() > Date.now());
  const pendingClaims = useMemo(() => summary?.claims.filter((claim) => claim.reviewStatus === "pending") ?? [], [summary]);
  const checkoutDisabled = plansLoading || !plans.length;

  useEffect(() => {
    if (!pendingClaims.length) {
      setSelectedClaimId("");
      return;
    }

    setSelectedClaimId((current) => current && pendingClaims.some((claim) => claim._id === current) ? current : pendingClaims[0]._id);
  }, [pendingClaims]);

  useEffect(() => {
    if (!summary?.user) return;

    const selectedCharityId = summary.user.selectedCharityId && typeof summary.user.selectedCharityId === "object"
      ? summary.user.selectedCharityId._id
      : summary.user.selectedCharityId ?? "";

    profileForm.reset({
      fullName: summary.user.fullName ?? "",
      charityPercentage: summary.user.charityPercentage ?? 10,
      selectedCharityId
    });

    donationForm.reset({ charityId: selectedCharityId, amount: 1000, message: "", successUrl: `${window.location.origin}/dashboard`, cancelUrl: `${window.location.origin}/dashboard` });
  }, [summary?.user?._id, summary?.user?.fullName, summary?.user?.charityPercentage, summary?.user?.selectedCharityId, profileForm, donationForm]);

  useEffect(() => {
    const currentPlanId = summary?.subscription?.planId && typeof summary.subscription.planId === "object"
      ? summary.subscription.planId._id ?? ""
      : "";
    const existingPlanId = checkoutForm.getValues("planId");
    if (existingPlanId) return;

    const preferredPlanId = currentPlanId
      ? plans.find((plan) => plan._id !== currentPlanId)?._id ?? currentPlanId
      : plans[0]?._id ?? "";

    checkoutForm.setValue("planId", preferredPlanId);
  }, [plans, summary?.subscription?.planId, checkoutForm]);

  async function refreshDashboard(force = true) {
    ["dashboard:subscriber", "billing:plans"].forEach((key) => clearClientCache(key));
    await Promise.all([refresh(force), refreshPlans(force)]);
  }

  async function launchSubscriptionCheckout(values: CheckoutInput, checkout: RazorpaySubscriptionCheckout) {
    const Razorpay = await loadRazorpayCheckout();

    if (checkout.kind === "subscription") {
      const instance = new Razorpay({
        key: checkout.key,
        subscription_id: checkout.subscriptionId,
        name: checkout.name,
        description: checkout.description,
        prefill: checkout.prefill,
        notes: checkout.notes,
        theme: checkout.theme,
        modal: {
          ondismiss: () => {
            if (checkout.cancelUrl) {
              window.location.assign(checkout.cancelUrl);
            }
          }
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
          try {
            const result = await request<{ message?: string; redirectUrl?: string }>("/billing/verify/subscription", {
              method: "POST",
              body: JSON.stringify({
                checkoutKind: "subscription",
                planId: values.planId,
                paymentId: response.razorpay_payment_id,
                subscriptionId: response.razorpay_subscription_id,
                signature: response.razorpay_signature
              })
            });
            toast.success(result.message ?? "Subscription activated");
            await refreshDashboard();
            if (result.redirectUrl) {
              window.location.assign(result.redirectUrl);
            }
          } catch (err) {
            toast.error((err as Error).message);
            await refreshDashboard();
          }
        }
      });

      instance.open();
      return;
    }

    const instance = new Razorpay({
      key: checkout.key,
      order_id: checkout.orderId,
      amount: checkout.amount,
      currency: checkout.currency,
      name: checkout.name,
      description: checkout.description,
      prefill: checkout.prefill,
      notes: checkout.notes,
      theme: checkout.theme,
      modal: {
        ondismiss: () => {
          if (checkout.cancelUrl) {
            window.location.assign(checkout.cancelUrl);
          }
        }
      },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try {
          const result = await request<{ message?: string; redirectUrl?: string }>("/billing/verify/subscription", {
            method: "POST",
            body: JSON.stringify({
              checkoutKind: "order",
              planId: values.planId,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            })
          });
          toast.success(result.message ?? "Subscription activated");
          await refreshDashboard();
          if (result.redirectUrl) {
            window.location.assign(result.redirectUrl);
          }
        } catch (err) {
          toast.error((err as Error).message);
          await refreshDashboard();
        }
      }
    });

    instance.open();
  }

  async function launchDonationCheckout(checkout: RazorpayDonationCheckout) {
    const Razorpay = await loadRazorpayCheckout();

    const instance = new Razorpay({
      key: checkout.key,
      order_id: checkout.orderId,
      amount: checkout.amount,
      currency: checkout.currency,
      name: checkout.name,
      description: checkout.description,
      prefill: checkout.prefill,
      notes: checkout.notes,
      theme: checkout.theme,
      modal: {
        ondismiss: () => {
          if (checkout.cancelUrl) {
            window.location.assign(checkout.cancelUrl);
          }
        }
      },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try {
          const result = await request<{ message?: string; redirectUrl?: string }>("/billing/verify/donation", {
            method: "POST",
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            })
          });
          toast.success(result.message ?? "Donation completed");
          donationForm.reset({ charityId: donationForm.getValues("charityId"), amount: 1000, message: "", successUrl: `${window.location.origin}/dashboard`, cancelUrl: `${window.location.origin}/dashboard` });
          await refreshDashboard();
          if (result.redirectUrl) {
            window.location.assign(result.redirectUrl);
          }
        } catch (err) {
          toast.error((err as Error).message);
          await refreshDashboard();
        }
      }
    });

    instance.open();
  }

  const submitScore = scoreForm.handleSubmit(async (values) => {
    try {
      await request("/scores", { method: "POST", body: JSON.stringify(values) });
      scoreForm.reset({ score: 32, playedAt: new Date().toISOString(), notes: "" });
      toast.success("Score saved");
      await refreshDashboard();
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  const startCheckout = checkoutForm.handleSubmit(async (values) => {
    if (!values.planId) {
      toast.error("No live subscription plans are available right now");
      return;
    }

    try {
      const response = await request<SubscriptionCheckoutResponse>("/billing/checkout", { method: "POST", body: JSON.stringify(values) });
      if (response.mode === "razorpay" && response.checkout) {
        await launchSubscriptionCheckout(values, response.checkout);
        return;
      }

      throw new Error(response.message ?? "Checkout could not be started");
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  const saveProfile = profileForm.handleSubmit(async (values) => {
    try {
      await request("/me", { method: "PATCH", body: JSON.stringify(values) });
      toast.success("Profile updated");
      await refreshDashboard();
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  const submitDonation = donationForm.handleSubmit(async (values) => {
    try {
      const response = await request<DonationCheckoutResponse>("/donations", { method: "POST", body: JSON.stringify(values) });
      if (response.mode === "razorpay" && response.checkout) {
        await launchDonationCheckout(response.checkout);
        return;
      }

      throw new Error(response.message ?? "Donation checkout could not be started");
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  const cancelSubscription = cancelForm.handleSubmit(async (values) => {
    try {
      await request("/billing/cancel", { method: "POST", body: JSON.stringify(values) });
      toast.success("Subscription cancelled");
      await refreshDashboard();
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  const submitProof = proofForm.handleSubmit(async (values) => {
    const claimId = values.notes && values.notes.startsWith("claim:") ? values.notes.replace(/^claim:/, "").trim() : pendingClaims[0]?._id;

    if (!claimId) {
      toast.error("No pending winner claim is available for proof submission");
      return;
    }

    try {
      setUploadState("uploading");
      const proofUrl = proofFile ? await uploadWinnerProof(proofFile) : values.proofUrl;
      await request(`/winner-claims/${claimId}/proof`, { method: "POST", body: JSON.stringify({ proofUrl, notes: values.notes }) });
      setProofFile(null);
      proofForm.reset({ proofUrl: "", notes: "" });
      toast.success(proofFile ? "Proof uploaded and submitted" : "Proof submitted");
      await refreshDashboard();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploadState("idle");
    }
  });

  if (isLoading && !summary?.user) return <LoadingState label="Loading subscriber dashboard" />;
  if (error && !summary?.user) return <ErrorState message={error} onRetry={() => void refreshDashboard(true)} />;

  return (
    <main className="space-y-6">
      <DashboardHero summary={summary} subscriptionStatus={subscriptionStatus} selectedCharityName={selectedCharity?.name ?? "None selected"} renewalLabel={subscriptionEndsAt ? subscriptionEndsAt.toLocaleDateString() : "Not set"} />

      {!hasActiveSubscription ? <EmptyState title="Activate your subscription" message="Your dashboard is visible, but scores, draw entry, and donation actions unlock only when your subscription is active." /> : null}

      <section className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
        <ProfileSettingsCard charities={charities} form={profileForm} onSubmit={saveProfile} />
        <SubscriptionControlCard plans={plans} plansLoading={plansLoading} plansError={plansError} checkoutForm={checkoutForm} cancelForm={cancelForm} onCheckout={startCheckout} onCancel={cancelSubscription} summary={summary} subscriptionStatus={subscriptionStatus} checkoutDisabled={checkoutDisabled} />
      </section>

      <ScoreSection form={scoreForm} onSubmit={submitScore} hasActiveSubscription={hasActiveSubscription} scores={summary?.scores ?? []} />
      <DonationWinningsSection charities={charities} donationForm={donationForm} onSubmitDonation={submitDonation} hasActiveSubscription={hasActiveSubscription} claims={summary?.claims ?? []} />
      <ProofParticipationSection proofForm={proofForm} onSubmitProof={submitProof} pendingClaims={pendingClaims} selectedClaimId={selectedClaimId} setSelectedClaimId={setSelectedClaimId} setProofFile={setProofFile} uploadState={uploadState} scores={summary?.scores ?? []} hasActiveSubscription={hasActiveSubscription} />
    </main>
  );
}


