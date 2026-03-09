# TTS Troubleshooting — Fix "Voice unavailable" / "fetch failed" / "TTS timeout"

If you see **🔇 Voice unavailable (Text-to-speech failed: fetch failed)** or **🔇 Voice unavailable (TTS timeout)**, the app cannot reach your TTS service. Follow these steps.

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

```bash
curl -v -X POST http://localhost:5002/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Namaste Teja ji", "language": "hi"}' \
  --output test.wav --write-out "\nTime: %{time_total}s"
```

- **Success:** `test.wav` is created and plays; time &lt;5s.
- **Connection refused:** Container not running or wrong port → re-run Step 1.
- **404 / wrong path:** Some images use `/tts` instead of `/api/tts`. Try:
  ```bash
  curl -v -X POST http://localhost:5002/tts \
    -H "Content-Type: application/json" \
    -d '{"text": "Namaste", "language": "hi"}' --output test.wav
  ```
  If that works, set in `.env`: `COQUI_TTS_URL=http://localhost:5002/tts`

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

## Summary

| Error              | Cause                    | Fix                                      |
|--------------------|--------------------------|------------------------------------------|
| fetch failed       | Coqui not running / wrong URL | Step 1 + 2 + 3, correct `COQUI_TTS_URL` |
| TTS timeout        | TTS took &gt;4s          | Ensure Coqui is on fast hardware or use VEXYL |
| Voice unavailable  | All TTS attempts failed  | Fix Coqui or VEXYL; check server logs    |
