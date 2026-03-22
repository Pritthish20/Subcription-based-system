import "dotenv/config";
import { createApp } from "../src/app";
import { initializeBackend } from "../src/bootstrap";

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

function normalizeApiPath(req: any) {
  const currentUrl = typeof req?.url === "string" ? req.url : "/";
  if (!currentUrl.startsWith("/api")) {
    const normalized = currentUrl === "/" ? "/api" : `/api${currentUrl.startsWith("/") ? currentUrl : `/${currentUrl}`}`;
    req.url = normalized;
    req.originalUrl = normalized;
  }
}

function isHealthRequest(req: { method?: string; url?: string }) {
  return req.method === "GET" && (req.url === "/api/health" || req.url === "/health" || req.url === "/api");
}

export default async function handler(req: any, res: any) {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  normalizeApiPath(req);

  if (isHealthRequest(req)) {
    res.status(200).json({ success: true, data: { status: "ok", runtime: "vercel" } });
    return;
  }

  try {
    await initializeBackend();
    return app(req, res);
  } catch (error) {
    console.error("Vercel backend initialization failed", error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Backend initialization failed",
        code: "BACKEND_INIT_FAILED"
      }
    });
  }
}
