// src/routes.ts
import { Router } from 'express';
import { DateTime } from 'luxon';
import { load, upsert, removeByToken } from './store';
import { sendPush } from './push';

const router = Router();

/** POST /notifications/subscribe */
router.post('/notifications/subscribe', async (req, res) => {
  try {
    const { token, hour, minute, tz, userId } = req.body ?? {};
    if (!token || hour == null || minute == null || !tz) {
      return res.status(400).json({ error: 'token, hour, minute, tz krävs' });
    }
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return res.status(400).json({ error: 'Ogiltig tid' });
    }
    const sub = await upsert({ token, hour, minute, tz, userId });
    res.json({ ok: true, sub });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/** POST /notifications/update-time */
router.post('/notifications/update-time', async (req, res) => {
  try {
    const { token, hour, minute, tz } = req.body ?? {};
    if (!token || hour == null || minute == null || !tz) {
      return res.status(400).json({ error: 'token, hour, minute, tz krävs' });
    }
    const sub = await upsert({ token, hour, minute, tz });
    res.json({ ok: true, sub });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/** POST /notifications/unsubscribe */
router.post('/notifications/unsubscribe', async (req, res) => {
  try {
    const { token } = req.body ?? {};
    if (!token) return res.status(400).json({ error: 'token krävs' });
    const removed = await removeByToken(token);
    res.json({ ok: true, removed });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/** POST /notifications/test */
router.post('/notifications/test', async (req, res) => {
  try {
    const { token, title = 'Test (Push)', body = 'Detta är en testpush 🎯' } = req.body ?? {};
    if (!token) return res.status(400).json({ error: 'token krävs' });
    await sendPush(token, title, body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/** GET /notifications/list – debug */
router.get('/notifications/list', async (_req, res) => {
  const db = await load();
  res.json(db.subscriptions);
});

/** GET /now?tz=Europe/Stockholm – visar tid i tz */
router.get('/now', (req, res) => {
  const tz = (req.query.tz as string) || 'UTC';
  const now = DateTime.now().setZone(tz);
  res.json({ tz, now: now.toISO(), hour: now.hour, minute: now.minute });
});

export default router;
