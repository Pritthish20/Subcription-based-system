import { z } from "zod";
import { DRAW_NUMBER_COUNT, DRAW_NUMBER_RANGE } from "../constants/domain";

const drawNumberSchema = z.number().int().min(DRAW_NUMBER_RANGE.min).max(DRAW_NUMBER_RANGE.max);

export const drawSimulationSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  mode: z.enum(["random", "weighted"])
});

export const drawPublishSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  mode: z.enum(["random", "weighted"]),
  numbers: z.array(drawNumberSchema).length(DRAW_NUMBER_COUNT).optional()
});

export type DrawSimulationInput = z.infer<typeof drawSimulationSchema>;
export type DrawPublishInput = z.infer<typeof drawPublishSchema>;
