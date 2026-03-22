import { z } from "zod";
import { SCORE_MAX, SCORE_MIN } from "../constants/domain";

export const scoreSchema = z.object({
  score: z.number({ error: "Score is required" }).min(SCORE_MIN).max(SCORE_MAX),
  playedAt: z.iso.datetime({ offset: true }),
  notes: z.string().max(240).optional()
});

export type ScoreInput = z.infer<typeof scoreSchema>;
