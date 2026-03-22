import "dotenv/config";
import { createApp } from "../src/app";
import { initializeBackend } from "../src/bootstrap";

const app = createApp();

function isHealthRequest(req: { method?: string; url?: string }) {
  return req.method === "GET" && (req.url === "/api/health" || req.url === "/health" || req.url === "/api");
}

export default async function handler(req: any, res: any) {
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
        message: "Backend initialization failed",
        code: "BACKEND_INIT_FAILED"
      }
    });
  }
}
