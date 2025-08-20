// src/server.ts
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { DateTime } from 'luxon';

import routes from './routes';
import { load } from './store';
import { sendPushBatch } from './push';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Push-server lyssnar på http://localhost:${PORT}`);
});

// CRON: kör varje minut
cron.schedule('* * * * *', async () => {
  try {
    const db = await load();
    if (!db.subscriptions.length) return;

    const messages: Array<{
      to: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }> = [];

    for (const sub of db.subscriptions) {
      const now = DateTime.now().setZone(sub.tz);
      if (now.hour === sub.hour && now.minute === sub.minute) {
        messages.push({
          to: sub.token,
          title: 'Dagens påminnelse',
          body: 'Kika på dina favoriter eller hitta nya Pokémon!',
          data: { kind: 'dailyReminder', ts: now.toISO() },
        });
      }
    }

    if (messages.length) {
      console.log(`Skickar ${messages.length} push-notiser...`);
      await sendPushBatch(messages);
    }
  } catch (e) {
    console.error('CRON-fel:', e);
  }
});
