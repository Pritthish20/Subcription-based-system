import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

function rateLimitHandler(message: string, code: string) {
  return (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message,
        code
      }
    });
  };
}

export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: rateLimitHandler("Too many authentication attempts. Please try again shortly.", "AUTH_RATE_LIMITED")
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler("Too many requests. Please slow down and try again.", "API_RATE_LIMITED")
});
