import { z } from "zod";

function normalizeOptionalProviderValue(value: unknown) {
  if (typeof value !== "string") return value;

  const normalized = value.trim();
  if (!normalized) return undefined;

  const lowered = normalized.toLowerCase();
  const placeholderPrefixes = ["optional_", "dummy_", "placeholder_", "your_"];
  if (placeholderPrefixes.some((prefix) => lowered.startsWith(prefix))) return undefined;
  if (["changeme", "change-me", "none", "null", "undefined"].includes(lowered)) return undefined;

  return normalized;
}

const optionalProviderValue = z.preprocess(normalizeOptionalProviderValue, z.string().min(1).optional());
const optionalPortValue = z.preprocess((value) => {
  const normalized = normalizeOptionalProviderValue(value);
  if (normalized === undefined) return undefined;
  if (typeof normalized === "number") return normalized;
  return Number(normalized);
}, z.number().int().positive().optional());
const optionalBooleanValue = z.preprocess((value) => {
  const normalized = normalizeOptionalProviderValue(value);
  if (normalized === undefined) return undefined;
  if (typeof normalized === "boolean") return normalized;
  const lowered = String(normalized).toLowerCase();
  if (["true", "1", "yes"].includes(lowered)) return true;
  if (["false", "0", "no"].includes(lowered)) return false;
  return normalized;
}, z.boolean().optional());

export const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  RAZORPAY_KEY_ID: optionalProviderValue,
  RAZORPAY_KEY_SECRET: optionalProviderValue,
  RAZORPAY_WEBHOOK_SECRET: optionalProviderValue,
  RAZORPAY_MONTHLY_PLAN_ID: optionalProviderValue,
  RAZORPAY_YEARLY_PLAN_ID: optionalProviderValue,
  CLOUDINARY_CLOUD_NAME: optionalProviderValue,
  CLOUDINARY_API_KEY: optionalProviderValue,
  CLOUDINARY_API_SECRET: optionalProviderValue,
  EMAIL_PROVIDER: z.enum(["mock", "smtp"]).default("mock"),
  EMAIL_FROM: z.string().default("no-reply@example.com"),
  SMTP_HOST: optionalProviderValue,
  SMTP_PORT: optionalPortValue,
  SMTP_SECURE: optionalBooleanValue,
  SMTP_USER: optionalProviderValue,
  SMTP_PASS: optionalProviderValue,
  APP_URL: z.string().default("http://localhost:5173"),
  ADDITIONAL_ALLOWED_ORIGINS: z.string().default("")
});

export type AppEnv = z.infer<typeof envSchema>;
