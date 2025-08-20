# ITHS – Laboration 2: React Native (Expo) + Beckend

# Push-server (Expo Push / dagliga påminnelser)

Liten Node/Express-server som:

- tar emot klienternas **Expo Push Tokens**,
- lagrar en **daglig tid** per token (+ tidszon),
- kör en **CRON-loop varje minut** och skickar pushnotiser via **Expo Push API** när klockslaget matchar.

Servern exponerar ett litet REST-API under `/api/*`.

---

## Innehåll

- [ITHS – Laboration 2: React Native (Expo) + Beckend](#iths--laboration-2-react-native-expo--beckend)
- [Push-server (Expo Push / dagliga påminnelser)](#push-server-expo-push--dagliga-påminnelser)
  - [Innehåll](#innehåll)
  - [Teknik \& paket](#teknik--paket)
  - [Projektstruktur](#projektstruktur)
  - [Datamodell \& lagring](#datamodell--lagring)
  - [Konfiguration](#konfiguration)
  - [Installation](#installation)
  - [Köra i utveckling \& produktion](#köra-i-utveckling--produktion)
  - [API-endpoints](#api-endpoints)
    - [1) Prenumerera / uppdatera (lägg till eller skriv över)](#1-prenumerera--uppdatera-lägg-till-eller-skriv-över)
    - [2) Avregistrera](#2-avregistrera)
    - [3) Skicka testpush till en token](#3-skicka-testpush-till-en-token)
    - [4) Lista alla prenumerationer (debug)](#4-lista-alla-prenumerationer-debug)
    - [5) Visa “nu” i en tz (debug)](#5-visa-nu-i-en-tz-debug)
  - [cURL-exempel](#curl-exempel)
  - [CRON-jobb](#cron-jobb)
  - [Tips, felsökning \& drift](#tips-felsökning--drift)
  - [Scripts (package.json)](#scripts-packagejson)
  - [Licens](#licens)

---

## Teknik & paket

**Prod-beroenden**

- **express** – HTTP-server & routing.
- **cors** – öppnar CORS så att klienten kan anropa servern från andra origins.
- **luxon** – tidszonssäker tid/datum (IANA-tz).
- **node-cron** – enkel CRON-schemaläggning i Node.
- **body-parser** – (ingår delvis i Express numera) men finns som beroende; i koden används `express.json()`.

> **Push mot Expo:** Anrop sker till `https://exp.host/--/api/v2/push/send`. Koden skickar i batchar om max ~100 meddelanden (rekommenderat av Expo).

**Dev-beroenden**

- **typescript** – typning & transpile till JS.
- **ts-node-dev** – snabb dev-server med autorestart.
- **@types/\*** – typsnitt för Node, Express, CORS, body-parser.

> **Node-version:** Kör med **Node 18+** så finns global `fetch`. Om du kör Node 16 krävs `node-fetch` och en import i `src/push.ts`.

---

## Projektstruktur

```
push-server/
├─ data/
│  └─ db.json                # JSON-databas (skapas automatiskt)
├─ dist/                     # Transpilerad JS (build-output)
│  ├─ *.js
│  └─ *.js.map
├─ src/
│  ├─ index.ts               # Entrypoint (startar servern)
│  ├─ server.ts              # Express-app, CRON, montering av routes
│  ├─ routes.ts              # REST-endpoints (/api/notifications/*)
│  ├─ push.ts                # Expo Push-klient (batchar, skickar)
│  └─ store.ts               # Enkel JSON "databas" + CRUD
├─ .env                      # (valfritt) PORT=4000
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

## Datamodell & lagring

Lagring sker i filen `data/db.json` (skapas **automatiskt** vid första körning).

```ts
// src/store.ts
export type Subscription = {
  token: string; // Expo Push Token
  hour: number; // 0–23
  minute: number; // 0–59
  tz: string; // IANA-tidszon, t.ex. "Europe/Stockholm"
  userId?: string; // valfritt fält
};

type Data = {
  subscriptions: Subscription[];
};
```

- **Upsert**: samma token skrivs över när den uppdateras (en token = en konfiguration).
- **Ta bort**: filtrerar bort token ur listan.
- Alla operationer (`load`, `save`, `upsert`, `removeByToken`) ser till att `data/` och `db.json` finns.

---

## Konfiguration

Valfritt `.env` i projektroten:

```env
PORT=4000
```

- Default-port i koden är `4000` om env saknas.
- Servern loggar vid start:  
  `Push-server lyssnar på http://localhost:4000`

---

## Installation

Med **npm**:

```bash
cd push-server

# 1) Installera beroenden
npm install

# 2) (Valfritt) generera dist/
npm run build
```

Med **pnpm** eller **yarn** fungerar motsvarande kommandon.

> Säkerställ **Node 18+** (global `fetch` i `src/push.ts`).  
> Node 16? Lägg till: `npm i node-fetch` och importera i `src/push.ts`.

---

## Köra i utveckling & produktion

**Utveckling (ts-node-dev):**

```bash
npm run dev
# startar på http://localhost:4000
```

**Produktion (build + start):**

```bash
npm run build
npm start
# kör dist/index.js -> dist/server.js etc.
```

Servern mountar alla endpoints under **`/api`**.

---

## API-endpoints

Bas-URL i dev: `http://localhost:4000/api`

### 1) Prenumerera / uppdatera (lägg till eller skriv över)

**POST** `/notifications/subscribe`  
Body:

```json
{
  "token": "ExpoPushToken[xxxxxxxx]",
  "hour": 18,
  "minute": 0,
  "tz": "Europe/Stockholm",
  "userId": "optional-user-id"
}
```

Svar:

```json
{
  "ok": true,
  "sub": { "token": "…", "hour": 18, "minute": 0, "tz": "Europe/Stockholm", "userId": "…" }
}
```

**POST** `/notifications/update-time`  
Body:

```json
{ "token": "ExpoPushToken[xxxxxxxx]", "hour": 20, "minute": 30, "tz": "Europe/Stockholm" }
```

Svar:

```json
{ "ok": true, "sub": { "token": "…", "hour": 20, "minute": 30, "tz": "Europe/Stockholm" } }
```

> Båda validerar att `token`, `hour`, `minute`, `tz` finns och att tiden är giltig.

### 2) Avregistrera

**POST** `/notifications/unsubscribe`  
Body:

```json
{ "token": "ExpoPushToken[xxxxxxxx]" }
```

Svar:

```json
{ "ok": true, "removed": true }
```

### 3) Skicka testpush till en token

**POST** `/notifications/test`  
Body:

```json
{
  "token": "ExpoPushToken[xxxxxxxx]",
  "title": "Test (Push)",
  "body": "Detta är en testpush 🎯"
}
```

Svar:

```json
{ "ok": true }
```

### 4) Lista alla prenumerationer (debug)

**GET** `/notifications/list` → returnerar `subscriptions[]` från `db.json`.

### 5) Visa “nu” i en tz (debug)

**GET** `/now?tz=Europe/Stockholm` →

```json
{ "tz": "Europe/Stockholm", "now": "2025-01-01T18:00:00.000+01:00", "hour": 18, "minute": 0 }
```

---

## cURL-exempel

```bash
# Subscribe
curl -X POST http://localhost:4000/api/notifications/subscribe   -H "Content-Type: application/json"   -d '{"token":"ExpoPushToken[xxx]","hour":18,"minute":0,"tz":"Europe/Stockholm"}'

# Update time
curl -X POST http://localhost:4000/api/notifications/update-time   -H "Content-Type: application/json"   -d '{"token":"ExpoPushToken[xxx]","hour":20,"minute":30,"tz":"Europe/Stockholm"}'

# Unsubscribe
curl -X POST http://localhost:4000/api/notifications/unsubscribe   -H "Content-Type: application/json"   -d '{"token":"ExpoPushToken[xxx]"}'

# Test push
curl -X POST http://localhost:4000/api/notifications/test   -H "Content-Type: application/json"   -d '{"token":"ExpoPushToken[xxx]","title":"Hej","body":"Detta är en testpush"}'

# List
curl http://localhost:4000/api/notifications/list

# Now
curl "http://localhost:4000/api/now?tz=Europe/Stockholm"
```

---

## CRON-jobb

I `src/server.ts`:

- **Kör varje minut**: `cron.schedule("* * * * *", async () => { ... })`
- Läser alla `subscriptions` från `data/db.json`.
- Beräknar **“nu” i varje prenumerants tidszon** (`luxon`), och om `hour/minute` matchar push-tiden:
  - pushas ett meddelande till Expo (`sendPushBatch`) med:
    ```json
    {
      "title": "Dagens påminnelse",
      "body": "Kika på dina favoriter eller hitta nya Pokémon!",
      "data": { "kind": "dailyReminder", "ts": "<ISO-tid>" }
    }
    ```
- Skickas i **batchar om upp till 100** meddelanden åt gången.

> Byt schema om du vill (t.ex. var 5:e minut): `"*/5 * * * *"`.

---

## Tips, felsökning & drift

- **Node 18+** – behövs för global `fetch` i `src/push.ts`.  
  Om du kör Node 16:
  1. `npm i node-fetch`,
  2. lägg till `import fetch from "node-fetch";` i `src/push.ts`.
- **CORS** är aktiverat globalt (`app.use(cors())`).
- **Beständig lagring** – `data/db.json` skrivs med `fs/promises`. Se till att mappen får skrivas i din miljö (Docker/hostning).
- **Loggar**:
  - Vid start: `Push-server lyssnar på http://localhost:<PORT>`
  - När push skickas: `Skickar N push-notiser...`
  - CRON-fel loggas som `CRON-fel: ...`
- **Säkerhet**:
  - De här endpoints är avsedda för en betrodd klient. Vid publik drift – lägg till auth (t.ex. API-nyckel) eller server-to-server.
  - Expo Push Token ska behandlas som känslig uppgift.

---

## Scripts (package.json)

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

- `src/index.ts` är entrypoint; den importerar/bootar `server.ts`.

---

## Licens

Alexander Gallorini - ITHS / JSU24
