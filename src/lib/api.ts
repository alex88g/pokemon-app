// src/lib/api.ts
import { API_BASE } from '@/config/env';

type JsonBody = Record<string, unknown> | undefined;

async function request<T>(path: string, init: RequestInit = {}, json?: JsonBody): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  let body = init.body;
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(json);
  }

  // ✅ Använd backticks för template literal
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, body });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${res.statusText} — ${text}`);
  }

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return undefined as unknown as T;

  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: JsonBody) => request<T>(path, { method: 'POST' }, body),
  del: <T>(path: string, body?: JsonBody) => request<T>(path, { method: 'DELETE' }, body),
};

export { API_BASE };
