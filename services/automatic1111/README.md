# Automatic1111 (A1111) — Self-hosted Image Generation

PayAid can generate images via **Stable Diffusion WebUI (Automatic1111)** using the built-in A1111 REST endpoints:

- `POST /sdapi/v1/txt2img`
- `POST /sdapi/v1/img2img`

This integrates through `@payaid/ai` (used by `apps/dashboard` routes like `POST /api/ai/image/generate`).

## Run A1111 (Docker)

If you already have an A1111 setup, skip this section and just set `A1111_URL`.

Example container (GPU):

```bash
docker run -d --name a1111 ^
  --gpus all ^
  -p 7860:7860 ^
  --restart always ^
  automatic1111/stable-diffusion-webui:latest
```

Notes:
- You still need to place a checkpoint model where your A1111 image expects it (varies by image/build).
- For production, do **not** expose port `7860` publicly; put it behind a reverse proxy/VPN.

## Configure PayAid

In your server environment (Vercel / container / VM), set:

```env
AI_IMAGE_PROVIDER=a1111
A1111_URL=http://127.0.0.1:7860
# Optional (only if your reverse-proxy expects a Bearer token):
# A1111_API_KEY=...
# Optional timeout (ms):
# A1111_TIMEOUT_MS=300000
```

If `AI_IMAGE_PROVIDER=auto`, PayAid will use A1111 when `A1111_URL` is set and Hugging Face is not configured (or fails).

## Smoke test (PayAid API)

With PayAid running locally on `http://localhost:3000`:

```bash
curl -X POST "http://localhost:3000/api/ai/image/generate" ^
  -H "Content-Type: application/json" ^
  -d "{\"prompt\":\"Modern Indian fintech product hero image, clean background, no text\",\"aspectRatio\":\"1:1\",\"style\":\"photo\"}"
```

Expected response shape:

- `url`: a `data:image/png;base64,...` URL
- `provider`: `a1111`

