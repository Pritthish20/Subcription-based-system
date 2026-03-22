import type { ErrorRequestHandler, RequestHandler } from "express";
import { ApiError, fail, toApiError } from "../lib/http";
import { logError, logWarn } from "../utils/logger";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`, {
      code: "ROUTE_NOT_FOUND",
      context: { method: req.method, path: req.originalUrl }
    })
  );
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const apiError = toApiError(error, { code: "INTERNAL_SERVER_ERROR" });
  apiError.context = {
    ...(apiError.context ?? {}),
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    controller: req.controllerName
  };

  const meta = {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    status: apiError.statusCode,
    code: apiError.code,
    message: apiError.message,
    controller: req.controllerName,
    userId: req.auth?.userId
  };

  if (apiError.statusCode >= 500) {
    logError("request.failed", {
      ...meta,
      issues: apiError.issues,
      stack: apiError.stack
    });
  } else {
    logWarn("request.rejected", meta);
  }

  fail(res, apiError, req.requestId);
};
