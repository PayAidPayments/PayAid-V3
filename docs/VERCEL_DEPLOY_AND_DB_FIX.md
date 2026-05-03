# Vercel deploy + Contact.churnRiskScore DB fix

## 1. "Can't create prospects/contacts" (Contact.churnRiskScore does not exist)

**Cause:** Production is still on an older deployment whose Prisma client expects `Contact.churnRiskScore` (and related columns). Your database never had those columns applied.

**Fix (run against production DB):**

- **Option A – Prisma migrate (recommended)**  
  From the project root, with `DATABASE_URL` pointing at **production**:
  ```bash
  npx prisma migrate deploy
  ```
  This applies the migration `20250226120000_add_contact_churn_phase1b`, which adds the missing columns.

- **Option B – One-off script**  
  With production `DATABASE_URL` in env or `.env`:
  ```bash
  node scripts/add-contact-churn-columns.js
  ```

- **Option C – Raw SQL**  
  If you use `psql`:
  ```bash
  psql "$DATABASE_URL" -f prisma/migrations/add_phase1b_contact_churn_columns.sql
  ```

After one of these, the **currently deployed** app will be able to create prospects/contacts. No redeploy needed for this fix.

---

## 2. Vercel: "Build Completed" then "Error: We encountered an internal error" on Deploying outputs

**What’s happening:** The build step finishes (e.g. "Build Completed in /vercel/output [11m]"), but the **Deploying outputs** step fails with an internal error. So the new build never goes live.

**Things to try:**

1. **Redeploy**  
   In Vercel: Deployments → … on the latest → Redeploy. Optionally enable "Clear build cache".

2. **Check Vercel status**  
   [vercel-status.com](https://www.vercel-status.com) – retry later if there’s an incident.

3. **Output size / limits**  
   The project has a very large number of routes and serverless functions. If the output is near Vercel’s limits, the deploy step can fail. Options:
   - Reduce static generation (e.g. more routes dynamic).
   - Open a ticket with Vercel support and share the deployment URL and the fact that the failure happens at "Deploying outputs" after a successful build.

4. **After a successful deploy**  
   Once a new deployment completes, production will use the latest code (including the schema that no longer relies on churn columns for create flows). The DB can keep the churn columns; they’re harmless.

---

## Summary

| Goal                         | Action |
|-----------------------------|--------|
| Fix "can't create prospects" **now** | Run one of the DB fixes above (migrate deploy, script, or SQL) against **production** `DATABASE_URL`. |
| Get the latest build live   | Resolve Vercel "internal error" (redeploy, status, support) so "Deploying outputs" succeeds. |
