import { DRAW_NUMBER_COUNT, DRAW_NUMBER_RANGE } from "../../../shared/src/index";

export function uniqueSortedNumbers(numbers: number[]) {
  return [...new Set(numbers)].sort((a, b) => a - b);
}

export function getRandomNumbers() {
  const pool = Array.from({ length: DRAW_NUMBER_RANGE.max }, (_, index) => index + 1);
  const result: number[] = [];

  while (result.length < DRAW_NUMBER_COUNT) {
    const nextIndex = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(nextIndex, 1)[0]);
  }

  return result.sort((a, b) => a - b);
}

export function weightedNumbers(scores: Array<{ score: number }>) {
  const frequency = new Map<number, number>();
  scores.forEach((entry) => frequency.set(entry.score, (frequency.get(entry.score) ?? 0) + 1));

  if (frequency.size < DRAW_NUMBER_COUNT) {
    return getRandomNumbers();
  }

  return uniqueSortedNumbers(
    [...frequency.entries()].sort((a, b) => b[1] - a[1]).slice(0, DRAW_NUMBER_COUNT).map(([score]) => score)
  );
}

export function countMatches(userScores: number[], drawNumbers: number[]) {
  const drawSet = new Set(drawNumbers);
  return [...new Set(userScores)].filter((score) => drawSet.has(score)).length;
}
