# PayAid Social Studio – Single-Flow UX & Self-Hosted Stack

## Overview

PayAid Social 2.0 is a **single-flow Marketing Studio** and a **standalone product** (PayAid Social) that can also be used inside PayAid V3 as the Marketing module. All components use **self-hosted services only**: PayAid Payments, your Docs/Drive, your AI stack (Ollama / self-hosted image/video), WAHA for WhatsApp, and your media storage (Supabase or R2). No third-party brand names are shown in the UI.

## Single-Flow Studio UX

The Studio is **one canvas** with four steps. Users do **not** jump between separate pages (Create Image → Create Post → Schedule). Flow:

1. **Audience & Goal** – Select segment (from Segments API), set marketing goal (Awareness / Traffic / Leads / Sales).
2. **Content & Media** – Prompt: “What do you want to promote?” Generate content (Ollama), images (self-hosted SD/Florence-2), optional UGC video (FFmpeg + Coqui TTS). Live preview by channel.
3. **Channels & Schedule** – Toggle channels (Email, WhatsApp, Facebook, LinkedIn, Twitter, Instagram, YouTube). Per-channel content and media. Send now or schedule.
4. **Review & Launch** – Summary and “Launch campaign” or “Save as draft”. Creates `MarketingPost` rows and enqueues Bull `social-post-dispatch` jobs.

State is held in a Zustand store in `@payaid/social` so it persists as the user moves between steps.

## Product Packaging

| Product            | Entry point              | Use case                          |
|--------------------|--------------------------|-----------------------------------|
| **PayAid Social**  | `apps/social` (port 3005) | Standalone Marketing-only app     |
| **PayAid V3 Suite**| `apps/dashboard`         | Marketing as one module among many |

- **Licensing:** `licensedModules` can include `"social"` (standalone) or `"marketing"` (in-suite). Standalone tenants see only Studio, Library, Analytics. Suite tenants see Marketing alongside CRM, HR, etc.
- Same codebase: shared package `packages/social` (Studio shell, store, types, media client, connector interfaces). Dashboard mounts the Studio at `/marketing/[tenantId]/Studio`.

## Self-Hosted Stack

- **AI content:** `POST /api/social/ai/content` → Ollama (or internal fallback). Primary post text + variants per channel.
- **AI images:** `POST /api/social/ai/image` → self-hosted image model (reuse Product Studio / Image Ads helpers); no external brand names in UI.
- **AI video (optional):** `POST /api/social/ai/video` → script (AI Influencer), Coqui TTS, FFmpeg; save MP4 to media library.
- **Media:** PayAid Drive (Supabase or R2). `packages/social` media client calls app’s `/api/media-library` (or `/api/social/media`).
- **WhatsApp:** WAHA connector in `packages/social/src/connectors/whatsapp.ts`; resolves contacts from segment, sends via WAHA HTTP API.
- **Social networks:** Connector stubs in `packages/social/src/connectors/` (facebook, linkedin, twitter, youtube). OAuth and post APIs to be implemented; UI stays “Connect your social account”.

## Routes and Cleanup

- **Dashboard Marketing:** `/marketing/[tenantId]/Studio` is the main Studio. Old routes redirect to Studio:
  - `/marketing/[tenantId]/Social-Media/Create-Post` → 301 to Studio
  - `/marketing/[tenantId]/Social-Media/Create-Image` → 301 to Studio
  - `/marketing/[tenantId]/Social-Media/Schedule` → 301 to Studio
- **Standalone app:** `apps/social`: `/`, `/login`, `/signup`, `/studio`, `/library`, `/analytics` (dev port 3005).

## Data Model

- **MarketingPost** (Prisma): `id`, `tenantId`, `campaignId?`, `channel`, `content`, `mediaIds[]`, `scheduledFor`, `status` (DRAFT | SCHEDULED | SENT | FAILED), `metadata`, `segmentId?`. One row per channel per launch.
- **Dispatch:** Bull queue `social-post-dispatch` consumes by `marketingPostId`; worker calls the right connector (WhatsApp, Email, SMS, FB, etc.) and updates status.

## Performance (1000+ users)

- ISR / `revalidate` for dashboard and analytics; `unstable_cache` for AI generations with tags.
- Lazy-load heavy components (video generator, image editor, ONLYOFFICE iframe) in Studio Step 2.
- Keep Studio initial JS &lt; 500KB gzip (e.g. with `@next/bundle-analyzer`).

## A La Carte

- **PayAid Social** standalone: ₹999/mo (Studio + Library + Analytics).
- **PayAid V3** full suite: all modules including Marketing.
- Entitlements: standalone Social tenants only see `apps/social` routes; suite tenants access Marketing from the dashboard.

## Environment

- **Standalone app (apps/social):**
  - `NEXT_PUBLIC_SOCIAL_API_URL` – Base URL of the API (e.g. `http://localhost:3000` when dashboard runs on 3000). Used so Studio launch calls `POST /api/social/posts` on the dashboard.
- **Worker (social-post-dispatch):**
  - `REDIS_URL` – Same as dashboard (e.g. `redis://localhost:6379`). Worker runs: `npm run worker:social-dispatch`.
  - `DATABASE_URL` – Same as dashboard so the worker can read/update `MarketingPost`.

## Database (MarketingPost table)

If `prisma migrate deploy` fails with **P3005** (database schema not empty), the DB was not created from Prisma migrations. Use **push** instead:

```bash
npx prisma db push --schema=packages/db/prisma/schema.prisma
```

This creates/updates the `MarketingPost` table (and any other schema drift) without migration history. To use migrations on this DB later, baseline the database first: [Prisma: Baseline production](https://pris.ly/d/migrate-baseline).

## How to Run

- **Dashboard (Marketing module):** `npm run dev` (or `dev:dashboard`). Open `/marketing/[tenantId]/Studio`.
- **Standalone Social app:** `npm run dev:social`. App runs on port 3005; set `NEXT_PUBLIC_SOCIAL_API_URL=http://localhost:3000` so Studio launch hits the dashboard API.
- **Dispatch worker:** `npm run worker:social-dispatch`. Listens on queue `medium-priority` for jobs with `marketingPostId`; updates `MarketingPost` status (SENT/FAILED). Wire WAHA/Email connectors in `server/workers/social-post-dispatch.ts`.
