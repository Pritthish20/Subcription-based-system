import { getEnv } from "./env";

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, "");
}

export function getAllowedOrigins() {
  const env = getEnv();
  const configured = [env.APP_URL, ...env.ADDITIONAL_ALLOWED_ORIGINS.split(",")]
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  return [...new Set(configured)];
}

export function isAllowedOrigin(origin?: string) {
  if (!origin) return true;
  return getAllowedOrigins().includes(normalizeOrigin(origin));
}
