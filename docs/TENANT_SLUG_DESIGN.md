# Tenant ID & Slug Design for PayAid V3

## Two-ID architecture (recommended)

| ID type        | Purpose                                      | Example                    |
|----------------|----------------------------------------------|----------------------------|
| **Internal UUID** | DB foreign keys, RLS, API, joins            | `550e8400-e29b-41d4-a716-446655440000` |
| **Public slug**   | URLs, tenant in routes, human-readable      | `acme-retail-4821`         |

- The UUID never appears in the URL.
- The slug is what users and the frontend see. If a business renames, update the slug and keep redirects from old slug.

## Slug format

```
{slugified-business-name}-{4-random-digits}
```

Examples:

- Acme Retail Pvt Ltd → `acme-retail-4821`
- Sri Venkatesh Traders → `sri-venkatesh-traders-3302`
- TechNova Solutions → `technova-solutions-7741`

Generation (see `lib/utils/generate-tenant-slug.ts`):

1. Take business name from onboarding.
2. Lowercase, replace spaces with `-`, strip special characters.
3. Drop common suffixes (Pvt, Ltd, LLP, Inc, etc.) and take up to 3 words.
4. Append `-` + 4 random digits (non-sequential).
5. Ensure uniqueness in `tenants` (e.g. unique index on `slug`); retry with new digits if collision.

## Supabase / Prisma schema

Add to `tenants` (or equivalent):

- `id` (UUID, primary key) — internal only.
- `slug` (TEXT, UNIQUE, NOT NULL) — used in URLs.
- `business_name`, `country`, `currency`, `plan`, etc.

All Supabase/Prisma queries use `id` for joins and RLS. The app resolves slug → id once per request (e.g. in layout or middleware) and then uses `id` for data.

## Resolving slug in the app

Today routes use `[tenantId]` which may be UUID or slug. To move to slug-only URLs:

1. In layout or middleware: `params.tenantId` → look up tenant by `slug` (or by `id` if it looks like a UUID).
2. Store `tenant.id` (UUID) in context so all data queries use it.
3. Use `tenant.slug` for building links.

## Slug history and redirects

When a slug is changed:

1. Insert the old slug into `tenant_slug_history` (e.g. `old_slug`, `new_slug`, `tenant_id`, `changed_at`).
2. In Next.js middleware: if the path segment matches an `old_slug` in history, 301 redirect to the same path with `new_slug`.

## What not to do

- Don’t use sequential integers for tenants (enumerable, exposes scale).
- Don’t put the raw UUID in URLs.
- Don’t use the slug as the primary key (changing it would break FKs).
- Do enforce a uniqueness constraint on `slug`.

## Utility

- `generateTenantSlug(businessName)` — `lib/utils/generate-tenant-slug.ts`
- Call from onboarding (e.g. `POST /api/tenants/create`) and retry on uniqueness failure (e.g. max 5 attempts).

**No existing data (e.g. Demo Business Pvt Ltd) is deleted or erased.** Adding `slug` is additive; backfill existing tenants with a generated slug when you adopt slug-based URLs.

## Implementation (PayAid V3)

- **Schema:** `Tenant.slug` (String?, @unique) in `prisma/schema.prisma`.
- **Resolve:** `lib/tenant/resolve-tenant.ts` — `resolveTenantFromParam(param)` returns `{ id, slug, shouldRedirectToSlug, publicId }`. Use `isValidSlugFormat()` to detect slug vs internal id.
- **API:** `GET /api/tenant/resolve?param=` — returns resolve result; used by client layouts to redirect UUID → slug (auth required).
- **Layout:** In client layouts (e.g. `app/hr/[tenantId]/layout.tsx`), call resolve API on mount; if `shouldRedirectToSlug`, `router.replace(buildTenantPath(pathname, publicId))`.
- **Backfill:** Run `npm run db:backfill-tenant-slugs` (or `npx tsx scripts/backfill-tenant-slugs.ts`) after applying the migration. New tenant creation (register, ensure-demo-user, sandbox-tenant, create-test-users, seed-demo-data, setup-demo-environment) sets `slug` via `generateUniqueTenantSlug(name, existingSlugs)`.
