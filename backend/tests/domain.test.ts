import { describe, expect, it } from "vitest";
import { calculateTierPools, countUniqueMatches, trimLatestScores } from "../../shared/src/index";

describe("score retention", () => {
  it("keeps only the latest five scores in reverse chronological order", () => {
    const trimmed = trimLatestScores([
      { score: 28, playedAt: "2026-03-01T10:00:00.000Z" },
      { score: 29, playedAt: "2026-03-02T10:00:00.000Z" },
      { score: 30, playedAt: "2026-03-03T10:00:00.000Z" },
      { score: 31, playedAt: "2026-03-04T10:00:00.000Z" },
      { score: 32, playedAt: "2026-03-05T10:00:00.000Z" },
      { score: 33, playedAt: "2026-03-06T10:00:00.000Z" }
    ]);

    expect(trimmed).toHaveLength(5);
    expect(trimmed[0].score).toBe(33);
    expect(trimmed.at(-1)?.score).toBe(29);
  });
});

describe("draw calculations", () => {
  it("counts unique matches against official draw numbers", () => {
    expect(countUniqueMatches([10, 10, 15, 22, 30], [10, 15, 18, 22, 40])).toBe(3);
  });

  it("rolls over the five-match pool when no jackpot winner exists", () => {
    const result = calculateTierPools(100000, 25000, { five: 0, four: 2, three: 4 });
    expect(result.pools.five).toBe(65000);
    expect(result.nextRollover).toBe(65000);
    expect(result.splitAmounts.four).toBe(17500);
    expect(result.splitAmounts.three).toBe(6250);
  });
});
