# Phase 0–2 Implementation Summary (PayAid V3 Self-Hosted Rebuild)

This document summarizes what was implemented for **Phase 0 (Infra)**, **Phase 1 (Monorepo layout)**, and **Phase 2 (DB & RBAC)** per the master Cursor prompt.

---

## Phase 0 – Docker stack (self-hosted)

### Created

- **`docker-compose.selfhosted.yml`** – Single compose file with:
  - **Core**: `postgres` (16-alpine), `redis`, `minio`, `n8n`, `onlyoffice`
  - **AI profile** (`--profile ai`): `ollama`, `openwebui`, `chroma`
  - Volumes and healthchecks for postgres, redis, chroma; optional for minio.
  - Ports overridable via env (e.g. `POSTGRES_PORT`, `OLLAMA_PORT`).

- **`Makefile`** – Targets:
  - `make up-core` – Core only (postgres, redis, minio, n8n, onlyoffice)
  - `make up-ai` – Core + AI (ollama, openwebui, chroma)
  - `make up` / `make down` / `make logs`
  - `make ollama-pull` – Pre-pull llama3.2, whisper-large-v3

- **Root `package.json` scripts**:
  - `npm run up-core` – Same as make up-core
  - `npm run up-ai` – Same as make up-ai
  - `npm run selfhost:up` – Full stack (profile ai)
  - `npm run selfhost:down` – Tear down

### Usage

```bash
# Core only (DB + Redis + MinIO + N8N + ONLYOFFICE)
docker compose -f docker-compose.selfhosted.yml up -d postgres redis minio n8n onlyoffice
# or: npm run up-core

# With AI (Ollama, OpenWebUI, Chroma)
docker compose -f docker-compose.selfhosted.yml --profile ai up -d
# or: npm run up-ai
```

---

## Phase 1 – Monorepo layout and core packages

### New apps (minimal shells)

- **`apps/suite`** – Main shell and module switcher (port 3010). Uses `@payaid/db`, `@payaid/ui`.
- **`apps/finance`** – Finance/accounting placeholder (port 3011).
- **`apps/settings`** – Tenant profile, users, roles, modules (port 3027).

Each has: `package.json`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.mjs`, `postcss.config.mjs`.

### Existing apps (unchanged)

- `apps/crm`, `apps/dashboard`, `apps/hr`, `apps/marketing`, `apps/platform`, `apps/social`, `apps/voice` – Already present.

### New package

- **`packages/automation`** – Stub for workflow definitions and N8N/Bull helpers (Phase 6).

### Remaining app shells (to add in follow-up)

Per the master plan, these can be added with the same pattern (layout + page + globals + config):

- `apps/inventory`, `apps/vendors`, `apps/whatsapp`, `apps/email`, `apps/website-builder`
- `apps/ai-cofounder`, `apps/legal`, `apps/invoicing`, `apps/payroll`, `apps/payouts`
- `apps/docs`, `apps/meetings`, `apps/chat-internal`, `apps/projects`, `apps/checkout`
- `apps/app-store`, `apps/automation` (UI for automation; package already added)

Turborepo will pick up any new `apps/*` via existing workspaces.

---

## Phase 2 – DB and RBAC (schema additions)

### Tenant (multi-language)

- **`defaultLocale`** – Optional string (e.g. `"en"`, `"hi"`).
- **`supportedLocales`** – String array, default `["en"]`.

### New models

- **`EmbeddingDocument`** – RAG: tenant, module, sourceId, content, optional embedding (Json), metadata. Unique on `(tenantId, module, sourceId)`.
- **`AiJob`** – Long-running AI jobs: tenantId, pipelineId, status, input/output/error, startedAt/completedAt. Indexes on tenantId, status, createdAt.
- **`ModelConfig`** – Per-tenant pipeline model: tenantId, pipelineId, modelId, isDefault. Unique on `(tenantId, pipelineId)`.

### Tenant relations

- `embeddingDocuments`, `aiJobs`, `modelConfigs` added on `Tenant`.

### Where

- **Root**: `prisma/schema.prisma` – All of the above.
- **Package**: `packages/db/prisma/schema.prisma` – Same changes (packages/db has an extra `TenantModule` relation; Phase 2 relations added there too).

### RBAC (already present)

- No schema changes. Existing models used as-is: `Role`, `UserRole`, `Permission`, `ModuleAccess`, `RolePermission`, `UserPermission`. Tenant has `licensedModules` (String[]).

---

## Next steps

1. **Run migrations** (after review):  
   `npx prisma migrate dev --name phase2_embedding_aijob_modelconfig` (or deploy with `prisma migrate deploy`).
2. **Review Phase 0–2** – Then proceed to **Phase 3** (CRM + Finance + HR full flows) per the master prompt.
3. **Optional**: Add remaining Phase 1 app shells (inventory, vendors, whatsapp, email, ai-cofounder, etc.) using the same structure as suite/finance/settings.

---

## Files touched

| Area        | Files |
|------------|--------|
| Phase 0    | `docker-compose.selfhosted.yml`, `Makefile`, `package.json` (scripts) |
| Phase 1    | `apps/suite/*`, `apps/finance/*`, `apps/settings/*`, `packages/automation/*` |
| Phase 2    | `prisma/schema.prisma`, `packages/db/prisma/schema.prisma` |
| Doc        | `PHASE_0_2_IMPLEMENTED.md` (this file) |

**Commit suggestion**: `v3-phase-0-2-selfhost-docker-suite-db`
