# Creative Studio (Marketing)

**Overview:** Creative Studio is a set of AI-powered tools under the Marketing module for creating ad creatives and marketplace-ready visuals without external agencies or shoots. It is inspired by Scalio-style workflows. Image generation can use **your own self-hosted image worker** (recommended; no API key or quota) or the tenant’s **Google AI Studio** API key (Settings > AI Integrations) as fallback.

---

## Where to find it

- **Navigation:** Marketing → **Creative Studio** (top bar).
- **Dashboard:** Marketing Home includes a **Creative Studio** band with shortcuts to all tools.
- **Hub:** `/marketing/[tenantId]/Creative-Studio` lists Product Studio, Model Studio, UGC Video Ads, and Image Ads.

---

## Tools

### 1. Product Studio

- **Path:** Marketing → Creative Studio → **Product Studio**
- **Purpose:** Upload a product image and get a set of three images: **main** (white background), **lifestyle**, and **infographic**, suitable for Amazon, Flipkart, Myntra, or Shopify.
- **API:** `POST /api/marketing/product-studio/generate`
  - **Body:** `FormData` with `file` (image), `marketplace` (amazon | flipkart | myntra | shopify), optional `templateId` (50+ category templates), optional `brandColor`, `brandTagline` (from Brand kit).
  - **Response:** `{ main, lifestyle, infographic, marketplace }` (data URLs or null).
- **Behaviour:** When **IMAGE_WORKER_URL** is set (self-hosted worker), generates all three images with your own SDXL/worker — no Google key or quota. Optional: tenant Google key can be used for a short product description to improve prompts. When self-hosted is not configured, uses Gemini (image-in or text-only with product description). Category template and brand kit apply in both cases.
- **Batch mode:** Toggle **Batch** to upload multiple product images; generate runs sequentially (one set per product). Results appear as a list of image sets with Download and Save to library per image.
- **Save to library:** Each generated image (main, lifestyle, infographic) has a **Save to library** button that stores the image in the tenant **Media Library** (category `creative-studio`, source `product-studio`).
- **Export:** Each result image can be downloaded as-is or exported at platform size: Amazon (3000×3000), Meta Feed (1080×1080), Stories (1080×1920), Google (1200×1200), Pinterest (1000×1500).

### 2. Model Studio

- **Path:** Marketing → Creative Studio → **Model Studio**
- **Purpose:** Upload a garment image and get an **on-model** photo (model wearing the garment) with chosen pose and background, Myntra/Shopify-ready.
- **API:** `POST /api/marketing/model-studio/generate`
  - **Body:** `FormData` with `file` (image), `pose` (auto | standing | walking | seated), `background` (studio | outdoor | lifestyle | white).
  - **Response:** `{ imageUrl, pose, background }`.
- **Behaviour:** Single on-model image with one automatic retry on failure.
- **Export:** Download as-is, **Export as** (platform size: Amazon, Meta Feed, Stories, Google, Pinterest), or **Save to library** (Media Library, source `model-studio`).

### 3. UGC Video Ads

- **Path:** Marketing → Creative Studio → **UGC Video Ads** (or Marketing → AI Influencer).
- **Purpose:** Create vertical UGC-style video ads (Reels, Shorts, TikTok) with AI scripts, voiceover, and actors. Uses the existing **AI-Influencer** flow.

### 4. Image Ads

- **Path:** Marketing → Creative Studio → **Image Ads**
- **Purpose:** Generate **static ad images** with hooks, price/discount, benefit CTA, and **overlay controls** (minimal, bold CTA, price badge, discount sticker, trust badge, countdown).
- **API:** `POST /api/marketing/image-ads/generate`
  - **Body:** `JSON` with `preset` (hook-product | price-drop | benefit-cta | custom), optional `hook`, `price`, `overlayStyle` (none | minimal | bold-cta | price-badge | discount-sticker | trust-badge | countdown), `ctaText` (e.g. "Shop Now"), `customPrompt` (when preset is custom), optional `brandColor`, `brandTagline` (from Brand kit).
  - **Response:** `{ imageUrl, preset }`.
- **Behaviour:** When **IMAGE_WORKER_URL** is set, uses your self-hosted image worker (no Google key). Otherwise uses Gemini; one retry. Overlay style and CTA text shape the prompt. Brand kit applied when set.
- **A/B variants:** Check **Generate 2 variants (A/B)** to get two images in one run; both are shown side-by-side (Variant A, Variant B) with Download, Save to library, and Export as for each.
- **Save to library:** Generated image(s) can be saved to the tenant **Media Library** (category `creative-studio`, source `image-ads`).
- **Export:** Download as-is or export at platform size (Amazon, Meta Feed, Stories, Google, Pinterest).

### 5. AI Image Studio (Create Image)

- **Path:** Marketing → Social Media → **Create Image** (or direct link from Creative Studio / Image Ads).
- **Purpose:** Generate static images from text prompts with cache, rate limits, and prompt history. Uses the same backend as above (Google AI Studio / Hugging Face) via a wrapped API that adds tenant controls.
- **API:** `POST /api/ai/image/generate`
  - **Body:** `{ prompt, negativePrompt?, style?, size?, provider? }`. Optional `negativePrompt` and platform `size` presets (e.g. Instagram Post, Story, LinkedIn Banner).
  - **Response:** `{ imageUrl, revisedPrompt?, cached?, service? }`. Response headers: `X-Remaining-Images-Today`, `X-Limit-Reset`, `X-Image-Daily-Limit`.
- **Behaviour:** Blocklist and brand guidelines (per tenant) are applied; daily limit (e.g. 50 Starter, 500 Pro) is enforced; identical prompt+params are served from cache when possible. Each generation is logged for audit and rate-limit count.
- **UI:** Prompt + negative prompt presets; platform size presets (Square, Portrait, Instagram Post/Story, LinkedIn, etc.); recent and saved prompts; generation history (last 20); “Use in post” (opens Create Post with image pre-filled); Download, Save to Library, Copy.
- **Other APIs:**
  - `GET /api/ai/image/limits` – returns `{ limit, used, remaining, resetAt }` and rate-limit headers.
  - `GET /api/ai/image/prompts` – recent and saved prompts; `POST` to record; `PATCH` to toggle saved.
  - `GET /api/ai/image/history` – last 20 generations (prompt, imageUrl, createdAt).
  - `GET/PATCH /api/ai/image/settings` – tenant settings: `promptBlocklist`, `brandGuidelines`, `dailyLimitOverride` (for admin).
- **Audit:** All generations are stored in `AIImageGenerationLog` (tenant, user, prompt, params, imageUrl, cached, createdAt). An admin/super-admin “Image generations audit” view can list or export this data for abuse monitoring (future).

---

## Self-hosted image generator (recommended)

To avoid Google quota, region, and key setup for users, run your own image worker and set **IMAGE_WORKER_URL** (or **TEXT_TO_IMAGE_SERVICE_URL**) in the server environment.

- **Included service:** `services/text-to-image/server.py` — Stable Diffusion XL, exposes `POST /generate` (prompt, style, size). Run with Python + diffusers (see service folder). Default port 7860.
- **Env:** `IMAGE_WORKER_URL=http://localhost:7860` (or `http://image-worker:8000` in Docker).
- **Used by:** Create Image (AI Image Studio), Product Studio, Image Ads. When set, it is tried first; Google/Hugging Face are fallbacks. Product Studio and Image Ads work **without** a tenant Google key when the worker is configured.

---

## Requirements

- **Module:** User must have **Marketing** module access.
- **Image generation:** Either **IMAGE_WORKER_URL** (self-hosted) or tenant **Google AI Studio** API key (Settings > AI Integrations). Model Studio still requires Google AI Studio for on-model generation.
- **Limits:** Product and Model Studio accept images up to **10MB**.

---

## Ad Insights (AI-CMO)

- **Path:** Marketing → Creative Studio → **Ad Insights**
- **Purpose:** View winning-strategy tips, use a research placeholder (competitor URL input; full research coming later), and jump to Product Studio or Image Ads to create creatives.
- **Sections:** **Research** (enter competitor or ad page URL → **Analyze** fetches the page and uses AI to return a summary + suggested creative angles), **Saved competitors** (add/remove URLs; **Analyze** per URL with expandable result), Winning strategies (static best-practice list), Create high-performing creatives (links to Product Studio & Image Ads).
- **Analyze API:** `POST /api/marketing/ad-insights/analyze` with `{ url? }` and optional `{ pastedContent? }`. If `pastedContent` is at least 50 characters, the API uses it and skips fetching the URL (paste-content fallback when the site blocks access). Otherwise requires a valid URL; fetches (timeout 12s), extracts title/meta/body text, then Gemini 2.0 Flash returns summary + suggested creative angles. Returns `{ summary, suggestedAngles, url }`.

---

## Brand kit

- **Where:** Creative Studio hub (bottom card). Set **primary color** (hex) and **tagline**; click Save.
- **Storage:** Persisted per tenant via **backend** (`GET/PATCH /api/marketing/creative-studio/brand`). The hub loads from API and syncs to localStorage so Product Studio and Image Ads (which read from `getStoredBrand()`) stay in sync.
- **Used by:** Product Studio and Image Ads include brand color and tagline in the AI prompt when generating, for a consistent look across creatives.

## Export presets

- **Product Studio, Image Ads & Model Studio:** After generation, use **Export as (platform size)** to download at: Amazon (3000×3000), Meta Feed (1080×1080), Stories/Reels (1080×1920), Google (1200×1200), Pinterest (1000×1500). Resize is done client-side.

## Save to Media Library

- **Product Studio:** Each of main, lifestyle, and infographic (single or batch) can be saved to the tenant Media Library (category `creative-studio`, source `product-studio`).
- **Image Ads:** Each generated image (single or A/B variant) can be saved (source `image-ads`).
- **Model Studio:** Generated on-model image can be saved (source `model-studio`).
- Uses `POST /api/media-library` with `fileName`, `fileUrl` (data URL), `fileSize`, `mimeType`, `width`, `height`, `title`, `category`, `source`, etc. Tenant storage limits apply.

## Roadmap

See **docs/13-roadmap.md** → “AI Creative Studio (Scalio-Inspired Features)” and “Creative Studio – Best-in-market enhancements”. Implemented: core tools, 50+ templates, overlay controls, export presets, brand kit (backend + hub), **batch Product Studio**, **Save to Media Library**, **Image Ads A/B variants**, **Model Studio export + Save to library**, **Ad Insights saved competitors**. Future: Ad Library integration, full competitor analysis.
