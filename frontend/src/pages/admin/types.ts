export type WinnerClaim = {
  _id: string;
  tier: "five" | "four" | "three";
  proofUrl?: string;
  proofNotes?: string;
  reviewStatus: "pending" | "approved" | "rejected";
  payoutStatus: "pending" | "paid";
  adminNotes?: string;
  prizeAmount?: number;
  paidAt?: string;
  userId?: { fullName?: string; email?: string };
  drawCycleId?: { month?: string; officialNumbers?: number[] };
};

export type AdminUser = {
  _id: string;
  fullName: string;
  email: string;
  role: "subscriber" | "admin";
  accountState: "pending" | "active" | "inactive";
  charityPercentage: number;
  selectedCharityId?: string | { _id: string; name?: string };
};

export type AdminSubscription = {
  _id: string;
  status: "incomplete" | "active" | "past_due" | "cancelled" | "lapsed";
  currentPeriodEnd?: string;
  cancellationReason?: string;
  userId?: { _id?: string; fullName?: string; email?: string };
  planId?: { name?: string; interval?: string; amountInr?: number };
};

export type AdminScore = {
  _id: string;
  score: number;
  playedAt: string;
  notes?: string;
  userId?: { _id?: string; fullName?: string; email?: string };
};

export type AdminDashboard = {
  totalUsers: number;
  activeSubscriptions: number;
  inactiveSubscriptions: number;
  charities: number;
  totalPrizePool: number;
  charityContributionTotals: number;
  subscriptionDonationTotals: number;
  independentDonationTotals: number;
  publishedDraws: number;
  pendingWinnerClaims: number;
  approvedWinnerClaims: number;
  rejectedWinnerClaims: number;
  totalPayouts: number;
  paidWinnerClaims: number;
  avgCharityPercentage: number;
  notificationStats: {
    sent: number;
    failed: number;
    queued: number;
    skipped: number;
  };
  latestPublishedDraw: {
    month: string;
    officialNumbers: number[];
    rolloverAmount: number;
    publishedAt?: string;
  } | null;
};

export type UserDraft = {
  fullName: string;
  email: string;
  role: "subscriber" | "admin";
  accountState: "pending" | "active" | "inactive";
  charityPercentage: number;
  selectedCharityId: string;
};

export type SubscriptionDraft = {
  status: "incomplete" | "active" | "past_due" | "cancelled" | "lapsed";
  currentPeriodEnd: string;
  cancellationReason: string;
};

export type ScoreDraft = {
  score: number;
  playedAt: string;
  notes: string;
};
