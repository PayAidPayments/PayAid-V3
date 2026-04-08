# Image Provider Switch Runbook

Use this runbook to switch image backends without changing frontend API calls.

## Stable API Contract

- Frontend always calls: `POST /api/ai/image/generate`
- Do not change client payload/response contract when switching providers.
- Provider selection is controlled by server env vars only.
- Modes supported: `txt2img`, `img2img`, `inpaint`.
- For `inpaint`, send both `sourceImageUrl` and `maskImageUrl`.

## Current Default (recommended now)

Use Hugging Face:

```env
AI_IMAGE_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_...
HUGGINGFACE_IMAGE_MODEL=black-forest-labs/FLUX.1-schnell
# Optional when using mode=inpaint:
# HUGGINGFACE_INPAINT_MODEL=runwayml/stable-diffusion-inpainting
```

Restart app server after env changes.

## QA Gate Controls (recommended)

Use these to enforce composition/reality checks before returning images:

```env
PAYAID_IMAGE_QA_GATE_ENABLED=true
PAYAID_IMAGE_QA_MAX_ATTEMPTS=3
PAYAID_IMAGE_QA_CANDIDATES=4
PAYAID_IMAGE_QA_MIN_SCORE=0.72
PAYAID_IMAGE_QA_REFINEMENT_ENABLED=true
PAYAID_IMAGE_QA_REFINEMENT_STRENGTH=0.4
```

Notes:
- The gate is most useful for checkout/payment prompts (hand + card + mouse + checkout screen).
- If enabled, the backend generates multiple candidates, applies QA scoring, and can run an automatic refinement pass.
- If all attempts fail QA, the API returns a controlled `422` response with QA details.
- For non-production debugging, send `qaDebug: true` in request body to include per-attempt QA diagnostics.

## Switch to A1111 (remote GPU host)

```env
AI_IMAGE_PROVIDER=a1111
A1111_URL=https://images.yourdomain.com
# Optional if gateway requires Bearer auth:
# A1111_API_KEY=...
# Optional:
# A1111_TIMEOUT_MS=900000
```

Notes:
- Prefer remote GPU host (12GB+ VRAM recommended for reliable SDXL-class workflows).
- Avoid local CPU-only A1111 for production latency/reliability.

## Switch to IMAGE_WORKER_URL

```env
AI_IMAGE_PROVIDER=worker
IMAGE_WORKER_URL=https://images.yourdomain.com
```

## Validation Checklist

1. Restart backend server.
2. Generate one test image from Studio.
3. Confirm API response includes expected `provider` value.
4. Confirm response time/error rate is acceptable.
5. For checkout/payment prompts, confirm QA response indicates pass (or controlled failure).

## Brand fidelity notes

- `brandColors` is enforced as a strong style constraint, but diffusion models may still drift.
- `brandLogoUrl` is treated as a textual hint in txt2img flows; exact logo reproduction is not guaranteed.
- For strict logo fidelity, use img2img/inpainting workflows with the actual logo image composited or conditioned.
- Recommended production approach: generate base scene, then apply inpaint/composite for logo-critical zones.

## Rollback

If new provider is unstable, revert env to:

```env
AI_IMAGE_PROVIDER=huggingface
```

Restart backend server.
