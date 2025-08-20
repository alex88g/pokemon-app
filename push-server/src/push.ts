// src/push.ts
export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export async function sendPushBatch(messages: PushMessage[]) {
  const chunks = chunk(messages, 100);
  for (const batch of chunks) {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });
  }
}

export async function sendPush(
  to: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  await sendPushBatch([{ to, title, body, data }]);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
