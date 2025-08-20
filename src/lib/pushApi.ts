// src/lib/pushApi.ts
import { api } from '@/lib/api';

export async function subscribe(token: string, hour: number, minute: number, tz: string) {
  return api.post('/notifications/subscribe', { token, hour, minute, tz });
}

export async function updateTime(token: string, hour: number, minute: number, tz: string) {
  return api.post('/notifications/update-time', { token, hour, minute, tz });
}

export async function unsubscribe(token: string) {
  return api.post('/notifications/unsubscribe', { token });
}

export async function testPush(token: string, title?: string, body?: string) {
  return api.post('/notifications/test', { token, title, body });
}
