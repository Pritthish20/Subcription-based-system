export type DashboardScore = {
  _id: string;
  score: number;
  playedAt: string;
  notes?: string;
};

export type DashboardClaim = {
  _id: string;
  tier: "five" | "four" | "three";
  proofUrl?: string;
  proofNotes?: string;
  reviewStatus: "pending" | "approved" | "rejected";
  payoutStatus: "pending" | "paid";
  prizeAmount?: number;
  createdAt?: string;
};

export type DashboardSummary = {
  user: {
    _id: string;
    fullName: string;
    selectedCharityId?: string | { _id: string; name?: string };
    charityPercentage?: number;
  } | null;
  subscription: {
    _id?: string;
    status?: string;
    currentPeriodEnd?: string;
    cancellationReason?: string;
    planId?: { name?: string; interval?: string; amountInr?: number };
  } | null;
  scores: DashboardScore[];
  claims: DashboardClaim[];
  drawsEntered: number;
  winningsTotal: number;
  upcomingDraw: {
    month: string;
    eligible: boolean;
    status: "eligible" | "inactive";
  } | null;
};
