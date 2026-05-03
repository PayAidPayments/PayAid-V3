# PayAid V3 – Scratch (Zoho-style modular suite)

Clean monorepo: **pnpm + Turbo**, small Prisma schema, decoupled apps (CRM, Suite), Docker stack, Redis cache, Ollama AI. No baggage from the previous codebase.

## Requirements

- Node 20+
- pnpm 9+ (`npm install -g pnpm` if missing)
- Docker (for db, redis, n8n, ollama)

## Quick start

```bash
# From repo root (or from payaid-v3-scratch if you moved it)
pnpm install
cd packages/db; pnpm db:generate; cd ../..
```

**PowerShell:** Use `;` instead of `&&`, or run: `pnpm --filter @payaid/db db:generate` from the monorepo root.

### Option A: Docker stack

**Bash / cmd:**  
```bash
docker compose up -d
export DATABASE_URL="postgresql://payaid:payaid_secret@localhost:5432/payaid"
export REDIS_URL="redis://localhost:6380"
pnpm db:push
pnpm dev:crm
```

**PowerShell:**  
```powershell
docker compose up -d
$env:DATABASE_URL="postgresql://payaid:payaid_secret@localhost:5432/payaid"
$env:REDIS_URL="redis://localhost:6380"
pnpm db:push
pnpm dev:crm
```

Open: http://localhost:3001

Post-login flow is now resolver-based and system-wide:
- Login always redirects to `/app` (or `/launch`, alias to `/app`).
- `/app` evaluates `licensed modules ∩ role permissions`.
- If exactly one eligible module exists, user is auto-redirected there.
- If multiple modules are eligible, user sees a module picker.
- If zero modules are eligible, user sees a “No modules assigned” screen.

### Option B: Supabase (free tier)

- Create project, get connection string.
- Enable Supavisor pooling (port 6543) if needed.
- `DATABASE_URL` and `REDIS_URL` (Upstash free or local Redis).

```bash
pnpm db:push
pnpm dev:crm
```

## RBAC (3-tier, Zoho-style)

- **SuperAdmin** – PayAid staff: all tenants, `/super` (tenants, users, invite). Set `SUPERADMIN_EMAIL=super@payaid.com` (or comma-separated). Login at `/super/login` (no tenant).
- **BusinessAdmin (ADMIN)** – Tenant owner: `/suite`, all modules, “Invite staff” → `/suite/staff`.
- **Staff (STAFF)** – Scoped by `permissions` (e.g. `crm:read`, `crm:write`, `crm:delete`). Module list and API guarded; read-only staff see CRM but create/edit/delete return 403.

After `pnpm db:push`, new users get ADMIN + full perms; existing users default to STAFF with no permissions (update via SuperAdmin or re-invite).

## Commands

| Command | Description |
|--------|-------------|
| `pnpm dev` | All apps (turbo) |
| `pnpm dev:web` | Unified app – port 3001 (`/crm`, `/hr`, `/suite`, `/super`) |
| `pnpm dev:crm` | CRM only – port 3001 |
| `pnpm dev:suite` | Suite only – port 3000 |
| `pnpm build` | Build all apps |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema (no migrations) |
| `pnpm seed` | Seed 1,000 demo leads |

## Load test (Windows-friendly)

If you don’t have `ab` installed, use `autocannon`:

```powershell
# run CRM first: pnpm dev:crm
npx -y autocannon -c 50 -d 20 http://localhost:3001/leads
```

## Apps

| App | Port | Purpose |
|-----|------|---------|
| **web** | 3001 | Unified app: `/login`, `/suite`, `/crm`, `/hr`, `/super` (RBAC) |
| **suite** | 3000 | Suite-only app |
| **crm** | 3001 | Standalone CRM |

## AI (Ollama)

- **Score lead:** `POST /api/ai/score-lead` with `{ leadId, tenantId }`.
- Requires Ollama with `llama3.2` (or set `OLLAMA_BASE_URL`). If Ollama is down, API falls back to a simple heuristic.

## Phase 1 (destructive cleanup)

See `scripts/PHASE1-README.md`. Do **not** run Phase 1 scripts until you intend to wipe the old repo and replace it with this scratch. Back up `MASTER_IMPLEMENTATION_AND_PLAN.md` first.

## Troubleshooting

- **P1000 (Authentication failed)**  
  `pnpm db:push` uses `packages/db/.env` → `DATABASE_URL`. The DB at that URL must accept the user/password in the URL.  
  - If the **web app** uses a different DB (e.g. Supabase in `apps/web/.env.local`), copy that `DATABASE_URL` into `packages/db/.env` and run `pnpm db:push` again so the schema is applied to the same DB the app uses.  
  - If you use **Docker**: ensure `docker compose up -d` is running and no other Postgres is bound to 5432 (or point `packages/db/.env` at the other server’s credentials).

- **"prisma" not found**  
  Use `pnpm db:push` from the monorepo root (it runs the db package’s `db:push` script). Do not run `prisma db push` directly unless you’re in `packages/db` and have run `pnpm install` there.

## Commit

Suggested: `git add . && git commit -m "phase-clean-scale-1"`
