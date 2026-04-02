import { DRAW_NUMBER_COUNT, MATCH_TIER_SHARES, SCORE_LIMIT, type DrawMode, type DrawPublishInput } from "../../../shared/src/index";
import { runService } from "../lib/http";
import { DrawCycle, DrawSimulation, PrizeAllocation, ScoreEntry, Subscription, User, WinnerClaim } from "../models";
import { getMonthWindow, getRandomNumbers, countMatches, uniqueSortedNumbers, weightedNumbers } from "../utils";
import { recordAdminAction } from "./audit.service";
import { notifyMany } from "./notification.service";

function monthlyPrizeContribution(subscription: any, plan: any) {
  const base = plan.interval === "yearly" ? plan.amountInr / 12 : plan.amountInr;
  return base * (plan.prizePoolContributionPercentage / 100);
}

export async function simulateDraw(month: string, mode: DrawMode, createdBy?: string) {
  return runService("draw.service", "simulateDraw", async () => {
    const activeUserIds = await Subscription.find({ status: "active" }).distinct("userId");
    const scores = await ScoreEntry.find(activeUserIds.length > 0 ? { userId: { $in: activeUserIds } } : {}).sort({ playedAt: -1 });
    const numbers = mode === "weighted" ? weightedNumbers(scores) : getRandomNumbers();
    return DrawSimulation.create({ month, mode, simulatedNumbers: numbers, insight: mode === "weighted" ? "Weighted toward the most frequent recent subscriber scores." : "Pure random lottery style simulation.", createdBy });
  });
}

export async function publishDraw(payload: DrawPublishInput, adminId?: string) {
  return runService("draw.service", "publishDraw", async () => {
    const { end } = getMonthWindow(payload.month);
    const [activeSubscriptions, previousDraw] = await Promise.all([
      Subscription.find({ status: "active" }).populate("planId"),
      DrawCycle.findOne({ status: "published", month: { $lt: payload.month } }).sort({ month: -1, publishedAt: -1 })
    ]);

    const userIds = activeSubscriptions.map((subscription) => subscription.userId);
    const [users, allScores] = await Promise.all([
      User.find({ _id: { $in: userIds } }),
      ScoreEntry.find({ userId: { $in: userIds }, playedAt: { $lt: end } }).sort({ playedAt: -1, createdAt: -1 })
    ]);

    const numbers = payload.numbers && payload.numbers.length === DRAW_NUMBER_COUNT ? uniqueSortedNumbers(payload.numbers) : payload.mode === "weighted" ? weightedNumbers(allScores) : getRandomNumbers();
    const scoreMap = new Map<string, number[]>();
    allScores.forEach((score) => {
      const list = scoreMap.get(score.userId.toString()) ?? [];
      if (list.length < SCORE_LIMIT) {
        list.push(score.score);
        scoreMap.set(score.userId.toString(), list);
      }
    });

    const eligibilitySnapshot = users.map((user) => ({ userId: user._id.toString(), charityId: user.selectedCharityId?.toString(), scores: scoreMap.get(user._id.toString()) ?? [] }));
    const draw = await DrawCycle.findOneAndUpdate({ month: payload.month }, { month: payload.month, mode: payload.mode, status: "published", eligibilitySnapshot, officialNumbers: numbers, rolloverAmount: previousDraw?.rolloverAmount ?? 0, publishedAt: new Date() }, { upsert: true, new: true });
    const matches = eligibilitySnapshot.map((entry) => ({ userId: entry.userId, matchCount: countMatches(entry.scores, numbers) }));
    const tierUsers = { five: matches.filter((entry) => entry.matchCount === 5), four: matches.filter((entry) => entry.matchCount === 4), three: matches.filter((entry) => entry.matchCount === 3) };
    const totalPrizePool = activeSubscriptions.reduce((total, subscription) => total + monthlyPrizeContribution(subscription, subscription.planId), 0);
    const fiveMatchPool = totalPrizePool * MATCH_TIER_SHARES.five + (previousDraw?.rolloverAmount ?? 0);
    const fourMatchPool = totalPrizePool * MATCH_TIER_SHARES.four;
    const threeMatchPool = totalPrizePool * MATCH_TIER_SHARES.three;
    const splitAmounts = { five: tierUsers.five.length ? fiveMatchPool / tierUsers.five.length : 0, four: tierUsers.four.length ? fourMatchPool / tierUsers.four.length : 0, three: tierUsers.three.length ? threeMatchPool / tierUsers.three.length : 0 };
    const rolloverAmount = tierUsers.five.length === 0 ? fiveMatchPool : 0;
    await WinnerClaim.deleteMany({ drawCycleId: draw._id });
    const claims = [...tierUsers.five.map((winner) => ({ userId: winner.userId, tier: "five", prizeAmount: splitAmounts.five })), ...tierUsers.four.map((winner) => ({ userId: winner.userId, tier: "four", prizeAmount: splitAmounts.four })), ...tierUsers.three.map((winner) => ({ userId: winner.userId, tier: "three", prizeAmount: splitAmounts.three }))];
    if (claims.length > 0) await WinnerClaim.insertMany(claims.map((claim) => ({ ...claim, drawCycleId: draw._id, reviewStatus: "pending", payoutStatus: "pending" })));
    await PrizeAllocation.findOneAndUpdate({ drawCycleId: draw._id }, { drawCycleId: draw._id, totalPrizePool, fiveMatchPool, fourMatchPool, threeMatchPool, rolloverAmount, winnerCounts: { five: tierUsers.five.length, four: tierUsers.four.length, three: tierUsers.three.length }, splitAmounts }, { upsert: true, new: true });
    draw.rolloverAmount = rolloverAmount;
    await draw.save();

    if (adminId) {
      await recordAdminAction({
        adminId,
        action: "draw.published",
        targetType: "draw",
        targetId: draw._id.toString(),
        after: draw,
        meta: { month: payload.month, officialNumbers: numbers, winnerCounts: { five: tierUsers.five.length, four: tierUsers.four.length, three: tierUsers.three.length }, splitAmounts }
      });
    }

    await notifyMany(userIds.map((userId) => userId.toString()), "draw.published", { month: payload.month, numbers, winnerCounts: { five: tierUsers.five.length, four: tierUsers.four.length, three: tierUsers.three.length } });
    return { draw, splitAmounts, winnerCounts: { five: tierUsers.five.length, four: tierUsers.four.length, three: tierUsers.three.length } };
  });
}

