import cors from "cors";
import express from "express";
import { getEnv, isAllowedOrigin } from "./config";
import { ApiError } from "./lib/http";
import { apiRateLimiter, authRateLimiter, errorHandler, helmetMiddleware, notFoundHandler, requestLogger } from "./middlewares";
import { createApiRouter } from "./routes";

export function createApp() {
  const app = express();
  const env = getEnv();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestLogger);
  app.use(helmetMiddleware);
  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(
          new ApiError(403, "Origin not allowed", {
            code: "ORIGIN_NOT_ALLOWED",
            context: { origin, allowedOrigins: env.ADDITIONAL_ALLOWED_ORIGINS }
          })
        );
      },
      credentials: true
    })
  );
  app.use("/api/billing/webhook", express.raw({ type: "application/json", limit: "1mb" }));
  app.use(express.json({ limit: "200kb" }));
  app.use(express.urlencoded({ extended: true, limit: "200kb" }));

  app.get("/", (_req, res) => {
    res.status(200).json({ message: "Golf Charity API is running", health: "ok" });
  });

  app.get("/favicon.ico", (_req, res) => {
    res.status(204).end();
  });

  app.use("/api/auth", authRateLimiter);
  app.use("/api", apiRateLimiter, createApiRouter());
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
