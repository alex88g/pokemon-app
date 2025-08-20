// src/hooks/useFetch.ts
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import axios, { AxiosRequestConfig } from 'axios';

type Options<T> = {
  enabled?: boolean;
  params?: AxiosRequestConfig['params'];
  headers?: AxiosRequestConfig['headers'];
  ttl?: number; // ms; 0 = ingen cache
  debounceMs?: number;
  retry?: number;
  transform?: (raw: any) => T;
  initialData?: T; // 🔹 visas direkt innan första laddningen
  onSuccess?: (data: T) => void;
  onError?: (message: string) => void;
};

// Cache
type CacheEntry<T> = { data: T; expiry: number };
const cache = new Map<string, CacheEntry<any>>();

export function clearFetchCache() {
  cache.clear();
}

export function useFetch<T = any>(url: string, options: Options<T> = {}) {
  const {
    enabled = true,
    params,
    headers,
    ttl = 0,
    debounceMs = 0,
    retry = 0,
    transform,
    initialData,
    onSuccess,
    onError,
  } = options;

  // Bygg cache-nyckel
  const key = useMemo(() => {
    const p = params ? JSON.stringify(params) : '';
    const h = headers ? JSON.stringify(headers) : '';
    return `${url}?p=${p}&h=${h}`;
  }, [url, params, headers]);

  // Kolla cache synkront för att slippa onödig "blinkande" loading
  const cached = cache.get(key);
  const hasFreshCache = cached && cached.expiry > Date.now();

  const [data, setData] = useState<T | null>(
    (hasFreshCache ? (cached!.data as T) : initialData) ?? null,
  );
  const [loading, setLoading] = useState<boolean>(
    Boolean(enabled && !hasFreshCache && !initialData),
  );
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState<boolean>(Boolean(cached && !hasFreshCache));
  const abortRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(
    async (ignoreCache = false) => {
      if (!enabled || !url) return;

      const now = Date.now();
      const c = !ignoreCache ? cache.get(key) : undefined;

      if (c && c.expiry > now) {
        setData(c.data as T);
        setIsStale(false);
        setLoading(false);
        setError(null);
        return;
      }

      if (c && c.expiry <= now) {
        setData(c.data as T);
        setIsStale(true);
      }

      if (debounceMs > 0) {
        await new Promise((r) => setTimeout(r, debounceMs));
      }

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      let attempts = 0;
      const maxAttempts = 1 + Math.max(0, retry);

      while (attempts < maxAttempts) {
        try {
          const res = await axios.get(url, {
            params,
            headers,
            signal: controller.signal,
          });

          const value = transform ? transform(res.data) : (res.data as T);
          setData(value);
          setIsStale(false);
          setError(null);
          onSuccess?.(value);

          if (ttl > 0) {
            cache.set(key, { data: value, expiry: Date.now() + ttl });
          }
          break;
        } catch (e: any) {
          if (controller.signal.aborted) return;
          attempts += 1;

          if (attempts >= maxAttempts) {
            const msg = e?.response?.status
              ? `Error ${e.response.status}: ${e.response.statusText || 'Request failed'}`
              : e?.message || 'Unknown error';
            setError(msg);
            onError?.(msg);
          } else {
            const backoff = 150 * Math.pow(2, attempts - 1);
            await new Promise((r) => setTimeout(r, backoff));
          }
        }
      }

      setLoading(false);
    },
    [enabled, url, key, params, headers, ttl, debounceMs, retry, transform, onSuccess, onError],
  );

  useEffect(() => {
    doFetch();
    return () => abortRef.current?.abort();
  }, [doFetch]);

  const refetch = useCallback(() => doFetch(true), [doFetch]);

  return { data, loading, error, isStale, refetch };
}
