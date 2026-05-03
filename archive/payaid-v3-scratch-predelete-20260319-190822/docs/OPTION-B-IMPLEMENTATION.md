# Option B Implementation – Fork → PayAid (Own It Forever)

## Day 1: Fork → PayAid Branded (~4 hrs)

### 1. Clone source

```bash
git clone https://github.com/espocrm/espocrm.git payaid-crm-app
cd payaid-crm-app
```

### 2. Branding (search/replace)

- **Text:** `EspoCRM` → `PayAid V3` in user-facing strings (client, application, install).
- **Logo:** Replace in `client/img/` or `client/res/templates/` (and any `custom/` overrides). Use PayAid logo asset.
- **Theme:** Adjust in Admin → Layout (or `client/css/`, theme metadata) – e.g. indigo/purple for PayAid.

Run from repo root (PowerShell):

```powershell
# Example: replace in PHP/JS/JSON (skip vendor, node_modules)
Get-ChildItem -Recurse -Include *.php,*.js,*.json,*.tpl | Where-Object { $_.FullName -notmatch 'vendor|node_modules' } | ForEach-Object {
  (Get-Content $_.FullName -Raw) -replace 'EspoCRM', 'PayAid V3' | Set-Content $_.FullName -NoNewline
}
```

Or use the script: `payaid-crm-app/scripts/brand-replace.ps1`.

### 3. Docker → localhost:8080

From `payaid-crm-app`:

```bash
docker-compose up -d
```

Then open **http://localhost:8080** and complete the web installer (DB credentials from `docker-compose.yml`).

### 4. Optional: run branding script

From `payaid-crm-app` (PowerShell):

```powershell
./scripts/brand-replace.ps1
```

Then review: keep “EspoCRM” in license/copyright blocks where AGPL requires.

### 5. pnpm db:push (Supabase + tenant_id)

- **PayAid CRM (Espo fork)** uses its own DB (MySQL/MariaDB in Docker). For **PayAid V3** (Next.js) you keep a **separate** Supabase schema.
- In the **main PayAid monorepo** (e.g. `apps/web` or `packages/db`):

  ```bash
  pnpm db:push
  ```

  Ensure your Prisma schema has `tenant_id` on all tenant-scoped tables and RLS policies so Supabase enforces `WHERE tenant_id = ?`.

- **If you later unify DB:** you can point EspoCRM at PostgreSQL (Supabase) and add a `tenant_id` column to Espo’s tables (or use a separate DB per tenant). Day 2 config prepares for tenant in config.

---

## Day 2: Multi-Tenant + Speed (~4 hrs)

### 1. config.php (runtime)

After install, EspoCRM writes `data/config.php`. Add or merge:

```php
<?php
return [
    // Multi-tenant: every entity filtered by this field
    'tenantIdField' => 'tenant_id',
    'teamsEntity'   => false,   // single DB, tenant isolation

    // Speed: Redis cache (optional but recommended)
    'cache' => 'redis',
    'redis' => [
        'host' => getenv('REDIS_HOST') ?: 'redis',
        'port' => (int) (getenv('REDIS_PORT') ?: 6379),
    ],
];
```

Use `data/config-internal.php` for secrets (DB password, etc.).

### 2. Resolve tenant from slug (middleware / bootstrap)

EspoCRM does not have a literal `middleware.php`. You can:

- **A) URL path:** Route `/crm/{slug}/...` via your reverse proxy (e.g. Next.js or nginx) so that requests to Espo include `?slug=acme-corp` or a header `X-Tenant-Slug: acme-corp`.
- **B) Bootstrap:** In Espo’s entry point (e.g. before app run), read `$_GET['slug']` or `$_SERVER['HTTP_X_TENANT_SLUG']`, call `getTenantBySlug($slug)` to get `tenant_id`, and set it in config or a global the app uses for all queries.

Example **bootstrap snippet** (conceptual – adapt to Espo’s bootstrap):

```php
// Resolve tenant from slug (e.g. from GET or header)
$slug = $_GET['slug'] ?? $_SERVER['HTTP_X_TENANT_SLUG'] ?? null;
if ($slug) {
    $tenant = getTenantBySlug($slug);  // your DB lookup
    if ($tenant) {
        define('CURRENT_TENANT_ID', $tenant['id']);
        // Espo will need to apply WHERE tenant_id = CURRENT_TENANT_ID on all queries
    }
}
```

### 3. RLS: WHERE tenant_id

- **Database:** Ensure every tenant-scoped table has `tenant_id` and an index.
- **Application:** All SELECT/UPDATE/DELETE must add `WHERE tenant_id = ?` (via Espo’s ORM/layer or a global scope). Espo’s core may need a small patch or extension to inject `tenant_id` into queries when `tenantIdField` is set (check Espo docs for multi-tenant or “multi-portal” options).
- **Supabase:** Use Row Level Security (RLS) so `tenant_id` is enforced at the DB layer for the Next.js app.

---

## Checklist

- [ ] Day 1: Clone, branding (EspoCRM → PayAid V3, logo, theme), docker-compose up, install at localhost:8080.
- [ ] Day 1: Main PayAid repo: `pnpm db:push` with `tenant_id` + RLS on Supabase.
- [ ] Day 2: config.php: `tenantIdField`, `teamsEntity`, `cache` => `redis`, `redis` config.
- [ ] Day 2: Resolve tenant from slug (proxy or bootstrap), set tenant id for each request.
- [ ] Day 2: All queries / RLS use `WHERE tenant_id`.
