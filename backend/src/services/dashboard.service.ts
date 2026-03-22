import { runService } from "../lib/http";
import { User } from "../models";

export async function listUsers() {
  return runService("dashboard.service", "listUsers", async () => User.find().sort({ createdAt: -1 }));
}

export async function buildAdminDashboard() {
  return runService("dashboard.service", "buildAdminDashboard", async () => {
    const { Charity, DonationAllocation, DrawCycle, NotificationLog, PayoutRecord, PrizeAllocation, Subscription, WinnerClaim } = await import("../models");

    const [
      totalUsers,
      activeSubscriptions,
      inactiveSubscriptions,
      charities,
      prizePool,
      donationTotals,
      publishedDraws,
      winnerStats,
      payoutTotals,
      notificationStats,
      avgCharityPercentage,
      latestDraw
    ] = await Promise.all([
      User.countDocuments(),
      Subscription.countDocuments({ status: "active" }),
      Subscription.countDocuments({ status: { $ne: "active" } }),
      Charity.countDocuments(),
      PrizeAllocation.aggregate([{ $group: { _id: null, total: { $sum: "$totalPrizePool" } } }]),
      DonationAllocation.aggregate([{ $group: { _id: "$type", total: { $sum: "$amountInr" } } }]),
      DrawCycle.countDocuments({ status: "published" }),
      WinnerClaim.aggregate([{ $group: { _id: "$reviewStatus", count: { $sum: 1 } } }]),
      PayoutRecord.aggregate([{ $group: { _id: null, total: { $sum: "$amountInr" }, count: { $sum: 1 } } }]),
      NotificationLog.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: null, avg: { $avg: "$charityPercentage" } } }]),
      DrawCycle.findOne({ status: "published" }).sort({ publishedAt: -1 }).lean()
    ]);

    const donationMap = Object.fromEntries(donationTotals.map((entry) => [entry._id, entry.total]));
    const winnerMap = Object.fromEntries(winnerStats.map((entry) => [entry._id, entry.count]));
    const notificationMap = Object.fromEntries(notificationStats.map((entry) => [entry._id, entry.count]));

    return {
      totalUsers,
      activeSubscriptions,
      inactiveSubscriptions,
      charities,
      totalPrizePool: prizePool[0]?.total ?? 0,
      charityContributionTotals: (donationMap.subscription ?? 0) + (donationMap.independent ?? 0),
      subscriptionDonationTotals: donationMap.subscription ?? 0,
      independentDonationTotals: donationMap.independent ?? 0,
      publishedDraws,
      pendingWinnerClaims: winnerMap.pending ?? 0,
      approvedWinnerClaims: winnerMap.approved ?? 0,
      rejectedWinnerClaims: winnerMap.rejected ?? 0,
      totalPayouts: payoutTotals[0]?.total ?? 0,
      paidWinnerClaims: payoutTotals[0]?.count ?? 0,
      avgCharityPercentage: avgCharityPercentage[0]?.avg ?? 0,
      notificationStats: {
        sent: notificationMap.sent ?? 0,
        failed: notificationMap.failed ?? 0,
        queued: notificationMap.queued ?? 0,
        skipped: notificationMap.skipped ?? 0
      },
      latestPublishedDraw: latestDraw
        ? {
            month: latestDraw.month,
            officialNumbers: latestDraw.officialNumbers ?? [],
            rolloverAmount: latestDraw.rolloverAmount ?? 0,
            publishedAt: latestDraw.publishedAt
          }
        : null
    };
  });
}
