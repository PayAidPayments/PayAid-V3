-- Allow Prisma db push to recreate the unique constraint on Tenant.slug
-- Safe: only drops if exists; Prisma will recreate it on next db push
ALTER TABLE "Tenant" DROP CONSTRAINT IF EXISTS "Tenant_slug_key";
DROP INDEX IF EXISTS "Tenant_slug_key";
