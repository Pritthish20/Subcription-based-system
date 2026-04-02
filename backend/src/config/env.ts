import { z } from "zod";
import { envSchema, type AppEnv } from "../../../shared/src/index";

const globalCache = globalThis as typeof globalThis & { appEnv?: AppEnv };

export function getEnv(): AppEnv {
  if (!globalCache.appEnv) {
    globalCache.appEnv = envSchema.parse(process.env);
  }

  return globalCache.appEnv;
}

export function isDemoEnv(env: AppEnv = getEnv()) {
  return env.APP_ENV === "demo";
}

export function isProductionEnv(env: AppEnv = getEnv()) {
  return env.APP_ENV === "production";
}
