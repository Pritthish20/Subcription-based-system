export * from "./constants/domain";
export * from "./types/api";
export * from "./types/domain";
export * from "./schemas/auth";
export * from "./schemas/score";
export * from "./schemas/subscription";
export * from "./schemas/charity";
export * from "./schemas/draw";
export * from "./schemas/winner";
export * from "./schemas/env";

import { MATCH_TIER_SHARES, SCORE_LIMIT } from "./constants/domain";

export function trimLatestScores<T extends { playedAt: string | Date }>(scores: T[]) {
  return [...scores]
    .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
    .slice(0, SCORE_LIMIT);
}

export function countUniqueMatches(userScores: number[], drawNumbers: number[]) {
  const drawSet = new Set(drawNumbers);
  return [...new Set(userScores)].filter((score) => drawSet.has(score)).length;
}

export function calculateTierPools(totalPrizePool: number, rolloverAmount: number, winnerCounts: { five: number; four: number; three: number }) {
  const pools = {
    five: totalPrizePool * MATCH_TIER_SHARES.five + rolloverAmount,
    four: totalPrizePool * MATCH_TIER_SHARES.four,
    three: totalPrizePool * MATCH_TIER_SHARES.three
  };

  return {
    pools,
    splitAmounts: {
      five: winnerCounts.five ? pools.five / winnerCounts.five : 0,
      four: winnerCounts.four ? pools.four / winnerCounts.four : 0,
      three: winnerCounts.three ? pools.three / winnerCounts.three : 0
    },
    nextRollover: winnerCounts.five ? 0 : pools.five
  };
}
