# TTS Troubleshooting — Fix "Voice unavailable" / "fetch failed" / "TTS timeout"

If you see **🔇 Voice unavailable (Text-to-speech failed: fetch failed)** or **🔇 Voice unavailable (TTS timeout)**, the app cannot reach your TTS service. Use **server TTS** for higher quality than the browser fallback.

---

## Server TTS quick start (higher quality)

Choose **one** option and set the matching URL in `.env`, then restart the app (`npm run dev`).

### Option A – Coqui TTS (Hindi/English, CPU, no API key)

**1. Start Coqui (one command):**

```bash
docker compose -f docker-compose.tts.yml up -d
```

Or with plain Docker:

```bash
docker run -d --name payaid-coqui-tts -p 5002:5002 -e COQUI_TOS_AGREED=1 ghcr.io/coqui-ai/tts-cpu:latest
```

Wait ~30s for the model to load.

**2. Test:**

Bash / WSL / Git Bash:

```bash
curl -X POST http://localhost:5002/api/tts -H "Content-Type: application/json" -d '{"text":"Namaste","language":"hi"}' -o test.wav -w "\nTime: %{time_total}s\n"
```

PowerShell (Windows):

```powershell
Invoke-RestMethod -Uri "http://localhost:5002/api/tts" -Method POST -ContentType "application/json" -Body '{"text":"Namaste","language":"hi"}' -OutFile test.wav
```

- **"Unable to connect" / "Connection refused":** Nothing is listening on port 5002. Run **Step 1** first (start the Coqui container), wait ~30s, then test again. Check with `docker ps` that a container with port 5002 is running.
- **Coqui container "Restarting (0)":** The official `ghcr.io/coqui-ai/tts-cpu` image does **not** start an HTTP server by default (it runs `tts --help` and exits). Use **Option C (VEXYL)** below if you already run VEXYL Voice Gateway, or use the updated `docker-compose.tts.yml` which overrides the command to start the server. See also [Coqui issue #2250](https://github.com/coqui-ai/TTS/issues/2250).
- **404:** Try path `/tts` instead of `/api/tts` and set that in `.env` below.

**3. In `.env`:**

```bash
COQUI_TTS_URL=http://localhost:5002/api/tts
```

If only `/tts` worked:

```bash
COQUI_TTS_URL=http://localhost:5002/tts
```

---

### Option B – PayAid AI services stack (GPU, XTTS v2)

If you already run the full AI stack with GPU:

```bash
docker compose -f docker-compose.ai-services.yml up -d
```

Then in `.env`:

```bash
COQUI_TTS_URL=http://localhost:7861/synthesize
```

The `text-to-speech` service exposes `POST /synthesize` and returns `audio_base64`.

---

### Option C – VEXYL TTS (22 Indian languages) or VEXYL Voice Gateway

**If you already run VEXYL Voice Gateway** (e.g. `docker compose -f docker-compose.vexyl.yml up -d`) and see it healthy on ports 8080–8082, use it for PayAid voice demo TTS:

1. In `.env` add (no API key needed if the gateway doesn’t require one):

```bash
VEXYL_TTS_URL=http://localhost:8081
# VEXYL_API_KEY=   # only if your gateway requires auth
```

2. If the gateway uses a different TTS path, set e.g. `VEXYL_TTS_PATH=/api/tts` (default is `/tts`).

3. Restart the Next.js app and try the Voice Demo. TTS will be served by the gateway (Gemini or Sarvam as configured in the gateway).

---

**Standalone VEXYL TTS** (no gateway). For 22 Indian languages and optional auth:

**1. Run VEXYL TTS** (if you have the image; see [VOICE_AGENTS_VEXYL_TTS.md](VOICE_AGENTS_VEXYL_TTS.md)):

```bash
docker run -d -p 8080:8080 --name payaid-vexyl-tts -e API_KEY=your-secret-key vexyl/vexyl-tts
```

**2. In `.env`** (comment out or leave unset `COQUI_TTS_URL` if using only VEXYL):

```bash
VEXYL_TTS_URL=http://localhost:8080
VEXYL_API_KEY=your-secret-key
```

If using the **VEXYL Voice Gateway** (port 8081) for TTS:

```bash
VEXYL_TTS_URL=http://localhost:8081
VEXYL_API_KEY=your-gateway-api-key
# If the gateway uses a different path:
# VEXYL_TTS_PATH=/api/tts
```

---

## Step 1: Verify Coqui Docker is running

```bash
docker ps | grep -E "coqui|tts|5002"
# Expected: container with port 5002:5002

docker logs payaid-tts 2>&1 | tail -20
# Expected: server listening on 0.0.0.0:5002 or similar
```

**Not running?** Start Coqui TTS:

```bash
docker stop payaid-tts 2>/dev/null
docker rm payaid-tts 2>/dev/null
docker run -d --name payaid-tts -p 5002:5002 ghcr.io/coqui-ai/tts-cpu:latest
```

Wait ~30s for the model to load, then check logs again.

---

## Step 2: Test the endpoint from your machine

Bash:

```bash
curl -v -X POST http://localhost:5002/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Namaste Teja ji", "language": "hi"}' \
  --output test.wav --write-out "\nTime: %{time_total}s"
```

PowerShell (Windows):

```powershell
Invoke-RestMethod -Uri "http://localhost:5002/api/tts" -Method POST -ContentType "application/json" -Body '{"text":"Namaste Teja ji","language":"hi"}' -OutFile test.wav
```

- **Success:** `test.wav` is created and plays; time &lt;5s.
- **Connection refused:** Container not running or wrong port → re-run Step 1.
- **404 / wrong path:** Some images use `/tts` instead of `/api/tts`. Try `/tts` in the URL; if that works, set in `.env`: `COQUI_TTS_URL=http://localhost:5002/tts`. In PowerShell: `Invoke-RestMethod -Uri "http://localhost:5002/tts" -Method POST -ContentType "application/json" -Body '{"text":"Namaste","language":"hi"}' -OutFile test.wav`

---

## Step 3: Set .env and restart the app

In `.env`:

```bash
# Coqui TTS (self-hosted, no API key). Must match your container's path.
COQUI_TTS_URL=http://localhost:5002/api/tts
```

If Step 2 only worked with `/tts`, use:

```bash
COQUI_TTS_URL=http://localhost:5002/tts
```

Restart the Next.js app (`npm run dev`). Try the Voice Demo again.

---

## Alternative: Use VEXYL TTS instead of Coqui

If you run **VEXYL Voice Gateway** or **VEXYL TTS**:

```bash
# In .env (no COQUI_TTS_URL, or comment it out)
VEXYL_TTS_URL=http://localhost:8080
VEXYL_API_KEY=your_key
```

See [VOICE_AGENTS_VEXYL_TTS.md](VOICE_AGENTS_VEXYL_TTS.md).

---

## "Text-to-speech failed: fetch failed"

This usually means the TTS service (VEXYL or Coqui/AI Gateway) could not be reached from the Next.js server.

- **If you use Sarvam for the demo:** Set `SARVAM_API_KEY` in `.env`. The voice demo will use Sarvam Chat + Sarvam Bulbul TTS and **won’t call VEXYL** for that path, so "fetch failed" from VEXYL won’t apply. Restart the app and try again.
- **If you rely on VEXYL for TTS:** Ensure the service is reachable from the server. From the same machine as the app run:  
  `Invoke-WebRequest -Uri "http://localhost:8081/health" -UseBasicParsing`  
  If that works but TTS still fails, the **VEXYL Voice Gateway** may not expose a standalone `POST /tts`. Try in `.env`:  
  `VEXYL_TTS_PATH=/api/tts`  
  (or the path from your gateway docs). If the gateway has no REST TTS endpoint, use **Sarvam** or **Coqui** for the browser demo instead.
- **If you use Coqui:** Ensure `COQUI_TTS_URL` is correct and the container is running (see Step 1–3 above).

After changes, restart the Next.js app and check server logs for `[TTS]` or `[Voice Demo]` for the exact error.

---

## Summary

| Error              | Cause                    | Fix                                      |
|--------------------|--------------------------|------------------------------------------|
| fetch failed       | TTS service unreachable (VEXYL/Coqui/Gateway) | Use Sarvam for demo, or fix VEXYL_TTS_URL / COQUI_TTS_URL; see "Text-to-speech failed: fetch failed" above |
| TTS timeout        | TTS took &gt;4s          | Ensure Coqui is on fast hardware or use Sarvam |
| Voice unavailable  | All TTS attempts failed  | Fix Coqui, VEXYL, or Sarvam; check server logs    |
