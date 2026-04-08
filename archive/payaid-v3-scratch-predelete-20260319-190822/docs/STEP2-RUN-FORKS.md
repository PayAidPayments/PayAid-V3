# Step 2: Running the CRM & Finance Forks

After replacing placeholders with EspoCRM and Bigcapital (Step 2), use these commands to run each module. They can be used **standalone** (direct URL) or **inside the web app** (shell at http://localhost:3001 loads them in iframes). See [RUN-TROUBLESHOOTING.md](./RUN-TROUBLESHOOTING.md) for the distinction.

---

## PayAid CRM (EspoCRM fork) – port 3003

**Location:** `apps/payaid-crm` (EspoCRM PHP source + Docker).

1. **Start CRM (Docker):**
   ```bash
   cd apps/payaid-crm
   docker compose up -d
   ```
   - First run: open **http://localhost:3003** and complete the EspoCRM install wizard (DB is already configured via env in docker-compose).
   - Default login after install: `admin` / `password` (set in docker-compose).

2. **Stop:**
   ```bash
   cd apps/payaid-crm
   docker compose down
   ```

3. **PayAid rebrand (logo, footer, favicon):** From repo root run `.\scripts\copy-crm-rebrand-into-container.ps1` after the container is up (see [RUN-TROUBLESHOOTING.md](./RUN-TROUBLESHOOTING.md)). Re-run after any `docker compose up -d` that recreates the container.

**Shell:** Set `PAYAID_CRM_URL=http://localhost:3003` in `apps/web/.env` (optional; this is the default).

---

## PayAid Finance (Bigcapital fork) – port 3004

**Location:** `apps/payaid-finance` (Bigcapital Node/Lerna monorepo).

**Important:** All Finance commands must run **from inside `apps/payaid-finance`**. If your terminal is elsewhere (e.g. in `apps/payaid-crm`), go to the **repo root first**, then into Finance.

### Option A: Bash / Git Bash
```bash
cd path/to/payaid-v3-scratch
cd apps/payaid-finance
pnpm install
cp .env.example .env
docker compose up -d
pnpm run build:server
pnpm run system:migrate:latest
# Then in two terminals from apps/payaid-finance (start dev:server first, then dev:webapp to avoid Nx SQLite lock):
pnpm run dev:server
pnpm run dev:webapp
```

### Option B: PowerShell (run from repo root)
From **repo root** `D:\Cursor Projects\PayAid V3\payaid-v3-scratch`:
```powershell
cd "D:\Cursor Projects\PayAid V3\payaid-v3-scratch\apps\payaid-finance"
pnpm install
Copy-Item .env.example .env
docker compose up -d
pnpm run build:server
pnpm run system:migrate:latest
```
Then open **two** terminals. **Start dev:server first**, wait until it’s running, then start dev:webapp (avoids Nx “database is locked”):
```powershell
cd "D:\Cursor Projects\PayAid V3\payaid-v3-scratch\apps\payaid-finance"
pnpm run dev:server
```
and in the other:
```powershell
cd "D:\Cursor Projects\PayAid V3\payaid-v3-scratch\apps\payaid-finance"
pnpm run dev:webapp
```

1. **Install** – must be run inside `apps/payaid-finance` (so Lerna and Bigcapital packages are available).
2. **Copy env** – `.env.example` is in `apps/payaid-finance`; use `Copy-Item .env.example .env` on PowerShell.
3. **Docker** – starts MySQL, Redis, MongoDB for Bigcapital (not the CRM stack).
4. **Build + migrate** – Use `pnpm run build:server` then `pnpm run system:migrate:latest` (Bigcapital uses NestJS; migrate runs via ts-node, not `node .../build/commands.js`).
5. **dev:server / dev:webapp** – Run from `apps/payaid-finance`. Start **dev:server first**, then in a second terminal run **dev:webapp** to avoid Nx SQLite “database is locked”. Optionally set `NX_DAEMON=false` if both still conflict.

**Shell:** Set `PAYAID_FINANCE_URL=http://localhost:3004` in `apps/web/.env` (optional; this is the default).

**Login:** Bigcapital has no default user. Use **Sign up** on the login page to create your first organization and account (any email and password). After that, use **Log in** with those credentials.

**"Something went wrong" on login page:** That usually means the **API server is not running**. The webapp on 3004 proxies `/api` to **localhost:3000**. Start **dev:server** first (in a terminal from `apps/payaid-finance`), wait until it is listening, then start **dev:webapp** and open http://localhost:3004. Both must be running for login/signup to work.

---

## Running the full suite

1. **Shell (apps/web):** `pnpm dev:web` or `pnpm dev` → shell on 3001.
2. **CRM:** `cd apps/payaid-crm && docker compose up -d` → CRM on 3003.
3. **Finance:** Follow “PayAid Finance” above → Finance on 3004.

Then open:
- **http://localhost:3001/crm/demo** → shell iframe to CRM (tenant slug `demo` must exist in DB).
- **http://localhost:3001/finance/demo** → shell iframe to Finance.

Ensure a tenant with slug `demo` exists (e.g. via seed or Super Admin).
