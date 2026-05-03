# Text-to-Image Service (SDXL)

Stable Diffusion XL text-to-image API used by PayAid for **Create Image**, **Product Studio**, and **Image Ads**. When this service is running and `IMAGE_WORKER_URL` is set, users do not need a Google AI Studio API key or face quota limits.

## API

- **POST /generate** — `{ "prompt": string, "style"?: string, "size"?: "1024x1024" }` → `{ "image_url": "data:image/png;base64,...", "revised_prompt": string, "generation_time"?: number }`
- **GET /health** — `{ "status": "healthy"|"loading"|"unhealthy", "model", "device" }`

## Run locally

```bash
cd services/text-to-image
pip install -r requirements.txt
python server.py
# Listens on http://localhost:7860
```

Then in your PayAid `.env`:

```env
IMAGE_WORKER_URL=http://localhost:7860
```

## Run with Docker

```bash
docker build -t payaid-text-to-image .
docker run -p 7860:7860 payaid-text-to-image
```

For GPU (faster):

```bash
docker run --gpus all -p 7860:7860 payaid-text-to-image
```

## Model

Default: `stabilityai/stable-diffusion-xl-base-1.0`. Override with `MODEL_NAME` (e.g. a smaller or fine-tuned model).

## PayAid usage

Once `IMAGE_WORKER_URL` is set, the app will use this service first for:

- **Create Image** (AI Image Studio)
- **Product Studio** (main, lifestyle, infographic)
- **Image Ads**

Google AI Studio and Hugging Face remain as fallbacks when the worker is unavailable or not configured.
