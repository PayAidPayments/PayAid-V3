# VEXYL-TTS Integration – Voice Agents

**Status:** Implemented  
**Use case:** Zero per-character TTS, 22 Indian languages, self-hosted, DPDP-compliant.

---

## 1. Why VEXYL for PayAid V3

- **Zero per-character cost** – scales to millions of IVR/call minutes
- **22 Indian languages** – Hindi, Tamil, Telugu, Kannada, etc.
- **Data in India** – DPDP-compliant
- **Telephony-ready** – 8 kHz for PBX/IVR
- **Self-hosted** – no cloud lock-in

---

## 2. Environment Variables

Copy from `.env.example` or add to your `.env` (or `.env.local`):

```bash
# VEXYL-TTS (optional – when set, TTS routes to VEXYL first)
VEXYL_TTS_URL=http://localhost:8080
VEXYL_API_KEY=your-secret-key
```

If these are **not** set, the app uses the existing stack (Coqui / Bhashini / IndicParler).

---

## 3. Running VEXYL-TTS (Docker)

**Note:** The image `vexyl/vexyl-tts` is **not** currently listed on Docker Hub. If `docker pull vexyl/vexyl-tts:latest` shows no output or fails, the image may be private or not yet published. Contact VEXYL or check their docs for the correct image name or access.

If you have access to a standalone VEXYL TTS image (or a compatible endpoint), use:

```bash
docker pull vexyl/vexyl-tts:latest
docker run -d \
  -p 8080:8080 \
  --name payaid-tts \
  -e API_KEY=your-secret-key \
  -e TTS_CACHE_SIZE=2GB \
  vexyl/vexyl-tts
```

Use the same `API_KEY` as `VEXYL_API_KEY` in PayAid. For production, use a URL pointing to your deployed instance (e.g. Railway, DigitalOcean, RunPod).

### Using Vexyl Voice Gateway (8081) for browser demo

If you run the **full gateway** (e.g. `docker run -d vexyl/vexyl-voice-gateway`, health at `http://localhost:8081/health`), you can try using it for TTS in the browser demo:

1. In `.env` set:
   ```bash
   VEXYL_TTS_URL=http://localhost:8081
   VEXYL_API_KEY=your-gateway-api-key
   ```
   If the gateway uses a different TTS path, set:
   ```bash
   VEXYL_TTS_PATH=/api/tts
   ```
   (default is `/tts`).

2. Restart the Next.js app. The browser demo (Voice Agents → Demo → Live conversation or single-turn mic) will call your app’s `/api/voice/demo`, which uses the shared TTS layer and will try VEXYL first.

3. If the gateway does not expose a standalone `POST /tts` (or your path) with a JSON body like `{ "text", "language", "speaker", "format" }` and returns WAV or JSON with `audio_base64`, TTS will fall back to Coqui/Bhashini/IndicParler. Check the gateway’s REST API docs for the exact TTS endpoint and payload.

**Standalone TTS (8080):** The image **vexyl/vexyl-tts** (standalone TTS only) may be available separately; if you have it, use `VEXYL_TTS_URL=http://localhost:8080` and the same `VEXYL_API_KEY` for a dedicated TTS service.

---

## 4. What Was Implemented

| Item | Location |
|------|----------|
| VEXYL TTS client | `lib/voice-agent/vexyl-tts.ts` |
| TTS routing (VEXYL first when configured) | `lib/voice-agent/tts.ts` |
| Orchestrator passing `voiceTone` | `lib/voice-agent/orchestrator.ts` |
| TTS API (preview + options) | `app/api/voice/tts/route.ts` (GET options, POST synthesize) |
| Agent create form: 22 languages, speaker, voice style | `app/voice-agents/[tenantId]/New/page.tsx` |
| API schemas (extended language, voiceTone) | `app/api/v1/voice-agents/route.ts`, `[id]/route.ts` |
| Supabase (manual SQL) | `scripts/supabase-voice-agents-vexyl-tts.sql` |

---

## 5. API Usage (from Next.js or server)

```typescript
// POST /api/voice/tts (authenticated)
const res = await fetch('/api/voice/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    text: 'Welcome to PayAid. Your invoice is ready.',
    language: 'hi',
    speaker: 'divya-calm',
    voiceStyle: 'calm',
  }),
})
const audioBuffer = await res.arrayBuffer()
```

---

## 6. Supabase

If you use Supabase for `voice_agents`, run the manual SQL once:

```bash
# In Supabase SQL Editor, run:
# scripts/supabase-voice-agents-vexyl-tts.sql
```

This ensures `voice_tone` (and language length) are available.

---

## 7. Working with the existing TTS setup (no VEXYL)

When `VEXYL_TTS_URL` and `VEXYL_API_KEY` are **not** set (or commented out in `.env`), voice agents use:

| Language | Provider |
|----------|----------|
| **English (en), Hindi (hi)** | Coqui XTTS v2 (via AI Gateway) |
| **Regional (ta, te, kn, mr, gu, pa, bn, ml, etc.)** | Bhashini → IndicParler → Coqui fallback |

### Prisma / DB

- Run **`npx prisma generate`** after schema changes so the client stays in sync.
- If you use **Supabase with the pooler**, the connection string must use username **`postgres.[PROJECT_REF]`** (not `postgres`), or you’ll get “Tenant or user not found”. See [Supabase pooler – Prisma & DATABASE_URL](SUPABASE_POOLER_DATABASE.md).

### Test checklist

1. **Start the app**  
   `npm run dev` (or your start command). Restart after changing `.env`.

2. **Open Voice Agents**  
   Go to `/voice-agents` → redirects to `/voice-agents/[tenantId]/Home/` when logged in.

3. **Create an agent**  
   Go to **New** (e.g. `/voice-agents/[tenantId]/New`). Set name, language (e.g. `en` or `hi`), system prompt, voice/speaker. Save.

4. **TTS preview**  
   Use the preview on the New/Edit form or call `POST /api/voice/tts` with `text`, `language`, `speaker`, `voiceStyle`. Expect Coqui for en/hi.

5. **Other pages**  
   - **Campaigns** – create/run campaigns.  
   - **Calls** – view call history.  
   - **Analytics** – view metrics.  
   - **Studio** – agent builder flow (if used).

6. **Optional**  
   Ensure AI Gateway (and any Bhashini/IndicParler env vars) are set if you use those providers.

---

## 8. Next Steps (Phases 2 & 3)

- **HR Voice Payslip** – “Play my Feb payslip” → TTS reads breakdown
- **Dialer + IVR** – Outbound/inbound with VEXYL TTS in regional languages
