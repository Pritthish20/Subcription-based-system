import { asyncHandler, ok } from "../lib/http";
import { getAuthContext } from "../middlewares";
import { DrawCycle } from "../models";
import { publishDraw, simulateDraw } from "../services/draw.service";
import type { DrawPublishInput, DrawSimulationInput } from "../validators/draw.validator";

export const simulateDrawController = asyncHandler("draw.simulateDrawController", async (req, res) => {
  const { user } = getAuthContext(req);
  const payload = req.body as DrawSimulationInput;
  ok(res, await simulateDraw(payload.month, payload.mode, user._id.toString()), 201);
});

export const publishDrawController = asyncHandler("draw.publishDrawController", async (req, res) => {
  const { user } = getAuthContext(req);
  ok(res, await publishDraw(req.body as DrawPublishInput, user._id.toString()));
});

export const listDrawResultsController = asyncHandler("draw.listDrawResultsController", async (_req, res) => {
  ok(res, await DrawCycle.find({ status: "published" }).sort({ publishedAt: -1 }).limit(12));
});
