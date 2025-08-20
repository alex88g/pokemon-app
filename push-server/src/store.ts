// src/store.ts
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export type Subscription = {
  token: string;
  hour: number; // 0-23
  minute: number; // 0-59
  tz: string; // IANA timezone, t.ex. "Europe/Stockholm"
  userId?: string;
};

type Data = {
  subscriptions: Subscription[];
};

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

async function ensureFile() {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(DB_FILE)) {
    const init: Data = { subscriptions: [] };
    await writeFile(DB_FILE, JSON.stringify(init, null, 2), 'utf8');
  }
}

export async function load(): Promise<Data> {
  await ensureFile();
  const buf = await readFile(DB_FILE, 'utf8');
  return JSON.parse(buf) as Data;
}

export async function save(data: Data) {
  await ensureFile();
  await writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export async function upsert(sub: Subscription) {
  const db = await load();
  const i = db.subscriptions.findIndex((s) => s.token === sub.token);
  if (i >= 0) db.subscriptions[i] = sub;
  else db.subscriptions.push(sub);
  await save(db);
  return sub;
}

export async function removeByToken(token: string) {
  const db = await load();
  const before = db.subscriptions.length;
  db.subscriptions = db.subscriptions.filter((s) => s.token !== token);
  await save(db);
  return before !== db.subscriptions.length;
}
