import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import type { ApiResponse } from "@shared/index";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api").replace(/\/$/, "");
let refreshPromise: Promise<string> | null = null;
type RazorpayConstructor = NonNullable<Window["Razorpay"]>;
let razorpayScriptPromise: Promise<RazorpayConstructor> | null = null;

const allowedProofMimeTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"]);
const maxProofFileSizeBytes = 5 * 1024 * 1024;

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (payload: unknown) => void) => void;
    };
  }
}

export type RazorpaySubscriptionCheckout = {
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

export const storage = {
  get token() {
    return localStorage.getItem("golf-charity-token") ?? "";
  },
  set token(value: string) {
    if (value) {
      localStorage.setItem("golf-charity-token", value);
    } else {
      localStorage.removeItem("golf-charity-token");
    }
  },
  get refreshToken() {
    return localStorage.getItem("golf-charity-refresh-token") ?? "";
  },
  set refreshToken(value: string) {
    if (value) {
      localStorage.setItem("golf-charity-refresh-token", value);
    } else {
      localStorage.removeItem("golf-charity-refresh-token");
    }
  },
  get role() {
    return localStorage.getItem("golf-charity-role") ?? "subscriber";
  },
  set role(value: string) {
    localStorage.setItem("golf-charity-role", value);
  }
};

export function clearSessionStorage() {
  storage.token = "";
  storage.refreshToken = "";
  storage.role = "subscriber";
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
};

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  user: { role?: string };
};

type ApiClientConfig = InternalAxiosRequestConfig & {
  auth?: boolean;
  _retry?: boolean;
};

const apiClient = axios.create({
  baseURL: apiBaseUrl
});

const publicClient = axios.create({
  baseURL: apiBaseUrl
});

function extractApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiResponse<unknown> | undefined;
    if (payload && typeof payload === "object" && "success" in payload && payload.success === false) {
      return payload.error.issues?.join(", ") || payload.error.message;
    }

    return error.message || "Request failed";
  }

  return error instanceof Error ? error.message : "Request failed";
}

async function refreshAccessToken() {
  if (!storage.refreshToken) {
    clearSessionStorage();
    throw new Error("Session expired");
  }

  if (refreshPromise) return refreshPromise;

  refreshPromise = publicClient
    .post<ApiResponse<RefreshResponse>>("/auth/refresh", { refreshToken: storage.refreshToken }, {
      headers: { "Content-Type": "application/json" }
    })
    .then(({ data }) => {
      if (!data.success) {
        clearSessionStorage();
        throw new Error(data.error.message);
      }

      storage.token = data.data.accessToken;
      storage.refreshToken = data.data.refreshToken;
      storage.role = data.data.user.role ?? "subscriber";
      return data.data.accessToken;
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

apiClient.interceptors.request.use((config) => {
  const nextConfig = config as ApiClientConfig;
  const shouldAttachAuth = nextConfig.auth ?? true;
  const isFormData = typeof FormData !== "undefined" && nextConfig.data instanceof FormData;
  const method = (nextConfig.method ?? "get").toUpperCase();
  const hasBody = nextConfig.data !== undefined && nextConfig.data !== null && method !== "GET" && method !== "HEAD";
  const headers = AxiosHeaders.from(nextConfig.headers ?? {});

  if (shouldAttachAuth && storage.token) {
    headers.set("Authorization", `Bearer ${storage.token}`);
  }

  if (!shouldAttachAuth) {
    headers.delete("Authorization");
  }

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  nextConfig.headers = headers;
  return nextConfig;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config as ApiClientConfig | undefined;
    if (!original || original._retry || error.response?.status !== 401 || !storage.refreshToken) {
      throw error;
    }

    if (typeof original.url === "string" && original.url.startsWith("/auth/")) {
      throw error;
    }

    original._retry = true;
    await refreshAccessToken();
    return apiClient.request(original);
  }
);

export async function restoreSession() {
  if (!storage.refreshToken) return null;
  const nextToken = await refreshAccessToken();
  return nextToken;
}

export async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  try {
    const response = await apiClient.request<ApiResponse<T>>({
      url: path,
      method: init?.method ?? "GET",
      data: init?.body,
      headers: init?.headers,
      auth: init?.auth
    } as AxiosRequestConfig & { auth?: boolean });

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

export const demoCharities = [
  {
    _id: "demo-charity-1",
    name: "First Swing Foundation",
    slug: "first-swing-foundation",
    category: "Junior Access",
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80",
    description: "Funds junior golf access, coaching scholarships, and transport for underrepresented young players.",
    events: [{ title: "Community Golf Day", startsAt: new Date().toISOString(), location: "Bengaluru" }]
  },
  {
    _id: "demo-charity-2",
    name: "Fairways For Care",
    slug: "fairways-for-care",
    category: "Health Outreach",
    featured: false,
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    description: "Supports mobile health camps and golf-day fundraising for families needing long-term treatment.",
    events: []
  }
];

export const demoPlans = [
  { _id: "plan-monthly", name: "Monthly Hero Pass", interval: "monthly", amountInr: 1499 },
  { _id: "plan-yearly", name: "Yearly Hero Pass", interval: "yearly", amountInr: 14999 }
];

export function currency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}
