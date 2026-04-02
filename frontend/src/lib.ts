import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import type { ApiResponse } from "@shared/index";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api").replace(/\/$/, "");
let refreshPromise: Promise<void> | null = null;
type RazorpayConstructor = NonNullable<Window["Razorpay"]>;
let razorpayScriptPromise: Promise<RazorpayConstructor> | null = null;

const allowedProofMimeTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"]);
const maxProofFileSizeBytes = 5 * 1024 * 1024;

const legacySessionKeys = ["golf-charity-token", "golf-charity-refresh-token", "golf-charity-role"] as const;

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (payload: unknown) => void) => void;
    };
  }
}

type RazorpayRecurringSubscriptionCheckout = {
  kind: "subscription";
  key: string;
  subscriptionId: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  successUrl: string;
  cancelUrl: string;
};

type RazorpayTestSubscriptionCheckout = {
  kind: "subscription-order";
  key: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  successUrl: string;
  cancelUrl: string;
};

export type RazorpaySubscriptionCheckout = RazorpayRecurringSubscriptionCheckout | RazorpayTestSubscriptionCheckout;

export type RazorpayDonationCheckout = {
  kind: "donation";
  key: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  successUrl: string;
  cancelUrl: string;
};

export function clearSessionStorage() {
  for (const key of legacySessionKeys) {
    localStorage.removeItem(key);
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  useAuth?: boolean;
};

type RefreshResponse = {
  user: { role?: string };
};

type ApiClientConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const authClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

const publicClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

function extractApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiResponse<unknown> | undefined;
    if (payload && typeof payload === "object" && "success" in payload && payload.success === false) {
      const context = payload.error.context as Record<string, unknown> | undefined;
      const providerReason = typeof context?.reason === "string" ? context.reason : undefined;
      const providerDescription = typeof context?.providerDescription === "string" ? context.providerDescription : undefined;
      const providerMessage = typeof context?.providerMessage === "string" ? context.providerMessage : undefined;
      return payload.error.issues?.join(", ") || providerReason || providerDescription || providerMessage || payload.error.message;
    }

    return error.message || "Request failed";
  }

  return error instanceof Error ? error.message : "Request failed";
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = publicClient
    .post<ApiResponse<RefreshResponse>>("/auth/refresh", {}, {
      headers: { "Content-Type": "application/json" }
    })
    .then(({ data }) => {
      if (!data.success) {
        clearSessionStorage();
        throw new Error(data.error.message);
      }
    })
    .catch((error) => {
      clearSessionStorage();
      throw new Error(extractApiError(error));
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

function withPreparedHeaders(config: InternalAxiosRequestConfig) {
  const isFormData = typeof FormData !== "undefined" && config.data instanceof FormData;
  const method = (config.method ?? "get").toUpperCase();
  const hasBody = config.data !== undefined && config.data !== null && method !== "GET" && method !== "HEAD";
  const headers = AxiosHeaders.from(config.headers ?? {});

  headers.delete("Authorization");

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  config.headers = headers;
  return config;
}

authClient.interceptors.request.use((config) => withPreparedHeaders(config));
publicClient.interceptors.request.use((config) => withPreparedHeaders(config));

authClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config as ApiClientConfig | undefined;
    if (!original || original._retry || error.response?.status !== 401) {
      throw error;
    }

    if (typeof original.url === "string" && original.url.startsWith("/auth/")) {
      throw error;
    }

    original._retry = true;
    await refreshAccessToken();
    return authClient.request(original);
  }
);

export async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  try {
    const client = init?.useAuth === false ? publicClient : authClient;
    const response = await client.request<ApiResponse<T>>({
      url: path,
      method: init?.method ?? "GET",
      data: init?.body,
      headers: init?.headers
    } as AxiosRequestConfig);

    const payload = response.data;
    if (!payload.success) {
      throw new Error(payload.error.issues?.join(", ") || payload.error.message);
    }

    return payload.data;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export async function loadRazorpayCheckout(): Promise<RazorpayConstructor> {
  if (typeof window === "undefined") {
    throw new Error("Razorpay Checkout can only run in the browser");
  }

  if (window.Razorpay) return window.Razorpay;
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise<RazorpayConstructor>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Razorpay Checkout failed to initialize")), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay Checkout")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
        return;
      }
      reject(new Error("Razorpay Checkout failed to initialize"));
    };
    script.onerror = () => reject(new Error("Failed to load Razorpay Checkout"));
    document.head.appendChild(script);
  }).finally(() => {
    razorpayScriptPromise = null;
  });

  return razorpayScriptPromise;
}

export function clearClientCache(prefix?: string) {
  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith("golf-cache:") && (!prefix || key.includes(prefix))) {
      sessionStorage.removeItem(key);
    }
  });
}

export async function uploadWinnerProof(file: File) {
  if (!allowedProofMimeTypes.has(file.type)) {
    throw new Error("Upload a PNG, JPEG, WEBP, HEIC, or HEIF screenshot");
  }

  if (file.size > maxProofFileSizeBytes) {
    throw new Error("Winner proof files must be 5 MB or smaller");
  }

  const signature = await request<{
    cloudName: string;
    apiKey: string;
    folder: string;
    timestamp: number;
    signature: string;
    uploadUrl: string;
  }>("/uploads/winner-proof-signature", { method: "POST", body: {} });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);

  try {
    const { data } = await axios.post<{ secure_url?: string; error?: { message?: string } }>(signature.uploadUrl, formData);
    if (!data.secure_url) {
      throw new Error(data.error?.message || "Cloudinary upload failed");
    }

    return data.secure_url;
  } catch (error) {
    throw new Error(extractApiError(error));
  }
}

export function currency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}


