import { useEffect, useRef, useState } from "react";
import { request } from "../../lib";

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inflightCache = new Map<string, Promise<unknown>>();

export function useCachedRequest<T>({
  cacheKey,
  path,
  fallback,
  enabled = true,
  staleMs = 60_000,
  throttleMs = 800,
  useAuth = false
}: {
  cacheKey: string;
  path: string;
  fallback: T;
  enabled?: boolean;
  staleMs?: number;
  throttleMs?: number;
  useAuth?: boolean;
}) {
  const [data, setData] = useState<T>(fallback);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const cachedMemory = memoryCache.get(cacheKey) as CacheEntry<T> | undefined;
    const cachedSessionRaw = sessionStorage.getItem(`golf-cache:${cacheKey}`);
    const cachedSession = cachedSessionRaw ? (JSON.parse(cachedSessionRaw) as CacheEntry<T>) : undefined;
    const cached = cachedMemory ?? cachedSession;

    if (cached && Date.now() - cached.timestamp < staleMs) {
      setData(cached.data);
      setIsLoading(false);
    }

    void refresh(cached ? false : true);
  }, [cacheKey, path, enabled, staleMs, useAuth]);

  async function refresh(force = false) {
    if (!enabled) return;

    const now = Date.now();
    if (!force && now - lastFetchRef.current < throttleMs) {
      return;
    }

    const inflight = inflightCache.get(cacheKey) as Promise<T> | undefined;
    if (inflight) {
      setIsLoading(true);
      try {
        const nextData = await inflight;
        setData(nextData);
        setError(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    lastFetchRef.current = now;
    const promise = request<T>(path, { useAuth });
    inflightCache.set(cacheKey, promise);

    try {
      const nextData = await promise;
      const entry = { data: nextData, timestamp: Date.now() };
      memoryCache.set(cacheKey, entry);
      sessionStorage.setItem(`golf-cache:${cacheKey}`, JSON.stringify(entry));
      setData(nextData);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      inflightCache.delete(cacheKey);
      setIsLoading(false);
    }
  }

  return { data, setData, isLoading, error, refresh };
}


