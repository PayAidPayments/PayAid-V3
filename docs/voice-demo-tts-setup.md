# Voice Demo TTS – Step-by-Step Setup

Get the voice demo (speak → agent reply with audio) working. TTS is tried in order: **Coqui Docker** → **VEXYL** (only if configured) → **AI Gateway**.

---

## If you see "Voice unavailable (Text-to-speech failed: HTTP 401)"

**Option A – Don’t use VEXYL (simplest)**  
Leave **`VEXYL_TTS_URL`** unset in `.env`. TTS will skip VEXYL and use the AI Gateway (or Coqui if you set `COQUI_TTS_URL`). Ensure `JWT_SECRET` matches the gateway (see Step 1–2 below).

**Option B – Use VEXYL with auth**  
If you run a VEXYL TTS server that requires an API key, add to **`.env`**:

```env
VEXYL_TTS_URL=http://localhost:8080
VEXYL_API_KEY=your-server-api-key
VEXYL_AUTH_HEADER=X-API-Key
```

- **VEXYL_API_KEY** – The key your VEXYL server expects (e.g. from its `API_KEY` env or docs).
- **VEXYL_AUTH_HEADER** – How to send it: `Bearer`, `X-API-Key`, `Api-Key`, or `none` if the server has no auth.

Restart the dev server after changing `.env`.

---

## Step 1: Check JWT_SECRET (for AI Gateway fallback)

The AI Gateway validates the same JWT your app uses. It must use the **same secret**.

1. Open your **`.env`** in the project root.
2. Find **`JWT_SECRET`**:
   - **If it exists** and is not `change-me-in-production`: note it (you’ll use it in Step 2).
   - **If it’s missing or still the placeholder**: set it to a long random string, e.g.:
     ```
     JWT_SECRET=your-own-long-random-secret-at-least-32-chars
     ```
     (You can generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

---

## Step 2: Give the AI Gateway the same JWT_SECRET

The gateway container must get `JWT_SECRET` from your environment.

1. If you start the stack with **Docker Compose** from the project root:
   ```powershell
   cd "d:\Cursor Projects\PayAid V3"
   docker compose -f docker-compose.ai-services.yml up -d ai-gateway
   ```
   Compose reads `.env` in the project root, so `JWT_SECRET` from Step 1 is passed to the gateway.

2. If you run the gateway some other way, set **`JWT_SECRET`** in that environment to the **exact same value** as in `.env`.

3. Restart the gateway so it picks up the secret:
   ```powershell
   docker compose -f docker-compose.ai-services.yml restart ai-gateway
   ```

---

## Step 3: Restart Next.js

So the app and gateway both use the same secret and the latest code:

```powershell
# Stop the dev server (Ctrl+C), then:
npm run dev
```

---

## Step 4: Test the voice demo

1. Log in to the app.
2. Go to **Voice Agents** → pick an agent → **Demo** (headset icon).
3. Allow the mic, say something (e.g. “Hello”).
4. You should get a text reply; if the gateway is used and the secret matches, you should also get **audio** (or at least no 401).

If you still see “Voice unavailable” or 401:

- Confirm **AI Gateway** is running: `docker ps` and look for `payaid-ai-gateway`.
- Confirm **same JWT_SECRET**: no typos, no extra spaces; gateway must see the same value as in `.env`.

---

## Optional: Use Coqui TTS Docker (no gateway auth)

If you prefer TTS to use your own container (no gateway, no JWT for TTS):

1. In **`.env`** add:
   ```
   COQUI_TTS_URL=http://localhost:7861/synthesize
   ```
2. Rebuild and start the TTS container (see repo for `COQUI_TOS_AGREED` and model load):
   ```powershell
   docker compose -f docker-compose.ai-services.yml build text-to-speech
   docker compose -f docker-compose.ai-services.yml up -d text-to-speech
   ```
3. Wait 2–3 minutes for the model to load, then try the voice demo again. TTS will use Coqui first and only fall back to the gateway if Coqui fails.

---

## Quick checklist

- [ ] `.env` has `JWT_SECRET` set (and not the placeholder).
- [ ] AI Gateway is started with the same `JWT_SECRET` (e.g. via `docker compose` from project root).
- [ ] Next.js dev server restarted after any `.env` change.
- [ ] Voice demo tested while logged in (so the request sends the JWT).
