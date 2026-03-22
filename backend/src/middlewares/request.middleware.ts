import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { logInfo } from "../utils/logger";

export const requestLogger: RequestHandler = (req, res, next) => {
  req.requestId = randomUUID();
  req.requestStartedAt = Date.now();

  res.on("finish", () => {
    const durationMs = req.requestStartedAt ? Date.now() - req.requestStartedAt : undefined;
    logInfo("request.completed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      userId: req.auth?.userId
    });
  });

  next();
};
