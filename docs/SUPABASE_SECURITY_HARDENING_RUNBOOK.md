# Supabase Security Hardening Runbook

This runbook closes high-priority Supabase Security Advisor findings:

- `rls_disabled_in_public`
- `sensitive_columns_exposed`

## Files

- `prisma/migrations/harden_supabase_public_access.sql`
- `prisma/migrations/verify_supabase_public_hardening.sql`
- `prisma/migrations/allowlist_supabase_api_tables.sql`
- `prisma/migrations/fix_rls_enabled_no_policy.sql`
- `prisma/migrations/fix_rls_enabled_no_policy_targeted.sql`

## Safe rollout sequence

1. **Backup first**
   - Create a DB backup/snapshot from Supabase before changes.
2. **Apply hardening**
   - Run `harden_supabase_public_access.sql` in Supabase SQL Editor.
3. **Verify**
   - Run `verify_supabase_public_hardening.sql`.
   - Confirm:
     - No tables without RLS.
     - No sensitive tables with `anon`/`authenticated` table privileges.
     - Sensitive tables have service-role policies.
4. **Close no-policy lint info**
   - If Security Advisor reports `rls_enabled_no_policy`, run `fix_rls_enabled_no_policy.sql`.
   - If a few specific tables still remain flagged, run `fix_rls_enabled_no_policy_targeted.sql`.
   - Re-run verification + Security Advisor.
5. **Re-scan**
   - Re-run Security Advisor and confirm findings are cleared.

## If a feature breaks after hardening

Some frontend features may rely on Supabase PostgREST access to specific tables.
Use the allowlist script to restore only required access:

1. Edit `allowlist_supabase_api_tables.sql` placeholders:
   - `__TABLE_NAME__`
   - `__TENANT_COLUMN__`
2. Grant only `SELECT` first.
3. Use tenant-scoped predicates in policies.
4. Re-run verification and app smoke tests.

## Operational rules

- Keep `anon` access disabled unless there is an explicit business need.
- Prefer `authenticated` + tenant-scoped policy checks.
- Never grant broad `INSERT/UPDATE/DELETE` to `anon`.
- Keep service-role-only policies for sensitive tables unless reviewed.
