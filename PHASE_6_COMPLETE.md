# Phase 6 – Resilience (TTS + Health) – Complete

## Summary

Phase 6 adds multi-provider TTS fallback (vexyl → sarvam → coqui) in `@payaid/ai`, a resilient `/api/tts` in the voice app, and a unified `/api/health` (redis, ai, db) in all apps.

---

## 1. TTS resilience (packages/ai)

- **packages/ai/src/tts.ts**
  - **`generateTTS(text, lang = 'hi')`** → `Promise<{ audio: Buffer | null, text: string, provider?: string }>`.
  - Tries providers in order: **vexyl → sarvam → coqui**; on first success returns audio; if all fail returns `{ audio: null, text }` (text mode).
  - **`tts(text, lang)`** kept for compatibility; throws when no provider succeeds.
- **packages/ai/src/providers/vexyl.ts** – Env: `VEXYL_TTS_URL` (required), `VEXYL_API_KEY`, `VEXYL_TTS_PATH`, `VEXYL_AUTH_HEADER`. Default export `(text, lang) => Promise<Buffer>`.
- **packages/ai/src/providers/sarvam.ts** – Env: `SARVAM_API_KEY` or `SARVAM_API_SUBSCRIPTION_KEY`. Uses `SARVAM_TTS_URL` (default `https://api.sarvam.ai/text-to-speech`). Default export `(text, lang) => Promise<Buffer>`.
- **packages/ai/src/providers/coqui.ts** – Env: `COQUI_TTS_URL`. Default export `(text, lang) => Promise<Buffer>`.

---

## 2. Voice app TTS API

- **apps/voice/app/api/tts/route.ts**
  - **GET** `?text=...&lang=hi` or **POST** `{ text, lang }`.
  - Calls **`generateTTS(text, lang)`** from `@payaid/ai`.
  - On success: returns **audio/wav** body.
  - On text fallback: returns **JSON** `{ text, fallback: true }`.
- **apps/voice/package.json** – Added dependency **`@payaid/ai`: `file:../../packages/ai`**.

---

## 3. Health endpoint (all apps)

- **apps/crm/app/api/health/route.ts**
- **apps/hr/app/api/health/route.ts**
- **apps/voice/app/api/health/route.ts**
- **apps/dashboard/app/api/health/route.ts**

**GET /api/health** returns:

```json
{
  "redis": true | false,
  "ai": true,
  "db": true | false,
  "status": "healthy" | "degraded"
}
```

- **redis**: `getRedisClient().ping()` (or false if Redis unavailable / noop client).
- **ai**: always `true`.
- **db**: `prisma.$queryRaw\`SELECT 1\`` then true, else false.
- **status**: `healthy` when db is ok, else `degraded`.

---

## 4. Verify

- **TTS (voice app):**  
  `GET http://localhost:3003/api/tts?text=नमस्ते&lang=hi` – returns audio or `{ text, fallback: true }`.
- **Health (any app):**  
  `GET http://localhost:3001/api/health` (crm), `3002` (hr), `3003` (voice), `3000` (dashboard).

---

**Commit:** `phase-6-resilience`
