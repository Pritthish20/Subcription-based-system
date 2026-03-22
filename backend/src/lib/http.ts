import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ApiResponse } from "../../../shared/src/index";

export type ErrorContext = Record<string, unknown>;
export type ApiErrorOptions = {
  issues?: string[];
  code?: string;
  context?: ErrorContext;
  cause?: unknown;
};

export class ApiError extends Error {
  statusCode: number;
  issues?: string[];
  code?: string;
  context?: ErrorContext;
  override cause?: unknown;

  constructor(statusCode: number, message: string, options?: ApiErrorOptions | string[]) {
    super(message);
    this.statusCode = statusCode;

    if (Array.isArray(options)) {
      this.issues = options;
      return;
    }

    this.issues = options?.issues;
    this.code = options?.code;
    this.context = options?.context;
    this.cause = options?.cause;
  }
}

export function sendResponse<T>(res: Response, statusCode: number, body: ApiResponse<T>) {
  return res.status(statusCode).json(body);
}

export function ok<T>(res: Response, data: T, statusCode = 200) {
  return sendResponse(res, statusCode, { success: true, data });
}

export function toApiError(error: unknown, fallback?: Partial<ApiErrorOptions> & { statusCode?: number; message?: string }) {
  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError(
    fallback?.statusCode ?? 500,
    fallback?.message ?? (error instanceof Error ? error.message : "Unexpected server error"),
    {
      code: fallback?.code ?? "INTERNAL_SERVER_ERROR",
      context: fallback?.context,
      cause: error
    }
  );
}

export function attachErrorContext(error: unknown, context: ErrorContext, fallbackCode?: string) {
  const apiError = toApiError(error, { code: fallbackCode ?? "INTERNAL_SERVER_ERROR" });
  apiError.context = { ...(apiError.context ?? {}), ...context };
  if (!apiError.code && fallbackCode) apiError.code = fallbackCode;
  return apiError;
}

export async function runService<T>(service: string, operation: string, action: () => Promise<T>) {
  try {
    return await action();
  } catch (error) {
    throw attachErrorContext(error, { service, operation }, "SERVICE_ERROR");
  }
}

export function fail(res: Response, error: ApiError | Error, requestId?: string) {
  const apiError = toApiError(error);
  if (requestId && !apiError.context?.requestId) {
    apiError.context = { ...(apiError.context ?? {}), requestId };
  }

  return sendResponse(res, apiError.statusCode, {
    success: false,
    error: {
      message: apiError.message,
      issues: apiError.issues,
      code: apiError.code,
      requestId
    }
  });
}

export function asyncHandler(controllerName: string, handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    req.controllerName = controllerName;
    void Promise.resolve(handler(req, res, next)).catch((error) => {
      next(attachErrorContext(error, { controller: controllerName, requestId: req.requestId }, "CONTROLLER_ERROR"));
    });
  };
}