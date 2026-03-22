import "dotenv/config";
import { createApp } from "../src/app";
import { initializeBackend } from "../src/bootstrap";
import { logError, logInfo } from "../src/utils/logger";

const app = createApp();

function applyCors(req: any, res: any) {
  const origin = req?.headers?.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      req?.headers?.["access-control-request-headers"] ?? "Content-Type, Authorization"
    );
  }
}

function isHealthRequest(req: { method?: string; url?: string }) {
  return req.method === "GET" && (req.url === "/api/health" || req.url === "/health" || req.url === "/api");
}

function shouldTraceRoute(req: { method?: string; url?: string; originalUrl?: string }) {
  const target = req.url ?? req.originalUrl ?? "";
  return req.method === "GET" && (target.includes("/billing/plans") || target.includes("/draws/results"));
}

export default async function handler(req: any, res: any) {
  applyCors(req, res);

  if (shouldTraceRoute(req)) {
    logInfo("vercel.route.debug", {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      path: req.path,
      host: req.headers?.host,
      origin: req.headers?.origin
    });
  }

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (isHealthRequest(req)) {
    res.status(200).json({ success: true, data: { status: "ok", runtime: "vercel" } });
    return;
  }

  try {
    await initializeBackend();
    return app(req, res);
  } catch (error) {
    logError("Vercel backend initialization failed", {
      message: error instanceof Error ? error.message : "Unknown initialization error"
    });
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Backend initialization failed",
        code: "BACKEND_INIT_FAILED"
      }
    });
  }
}

