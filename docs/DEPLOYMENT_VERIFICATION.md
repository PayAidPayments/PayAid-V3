# PayAid V3 – Deployment verification (mandatory)

**Status:** Living document  
**Purpose:** Ensure production is correctly configured and reachable.

**Production URL:** [https://payaid-v3.vercel.app/](https://payaid-v3.vercel.app/)

**Automated:** You can run the verification script (section 2) yourself anytime. **Manual only:** Section 4 lists steps that require you to log in to Vercel and Supabase (env vars, redeploy).

---

## 1. Mandatory: Vercel environment variables

Before the app can use the database and cron in production:

1. Open **Vercel Dashboard** → project **payaid-v3** → **Settings** → **Environment Variables**.
2. Set (or update) these for **Production** and **Preview** as needed:

   | Variable      | Required | Description |
   |----------|----------|-------------|
   | `DATABASE_URL` | **Yes** | Postgres connection string from your provider. Example: `postgresql://user:pass@host:5432/db?sslmode=require` |
   | `CRON_SECRET` | For cron | Secret for `/api/cron/*` endpoints; must match what you send in `Authorization: Bearer <CRON_SECRET>`. |
   | `NEXTAUTH_SECRET` / JWT secret | If used | Any auth-related secret your app expects. |

3. **Redeploy** after changing env vars (Vercel usually prompts; otherwise trigger a redeploy).

**Supabase (free tier):** Use the **pooled** connection string, not the direct one. In Supabase Dashboard → **Project Settings** → **Database**, use the URI under **Connection pooling** (e.g. **Transaction** or **Session** mode, port **6543**). The direct connection (port 5432) is not included on the free tier and may require a paid plan. If you see connection or payment prompts, switch to the pooled URI.

---

## 2. Mandatory: Run verification script

After deployment and env setup:

1. **PowerShell (Windows):**
   ```powershell
   cd "D:\Cursor Projects\PayAid V3"
   .\scripts\verify-deployment.ps1
   ```
   The script defaults to **https://payaid-v3.vercel.app**. To test a different URL (e.g. a preview deployment):
   ```powershell
   $env:BASE_URL = "https://your-preview.vercel.app"; .\scripts\verify-deployment.ps1
   ```

2. **Bash (Linux/Mac):** Use the same logic with a shell script if available, or call the same endpoints (health, login, etc.) manually.

3. The script checks:
   - Health check (`/api/health`)
   - Admin password reset (if applicable)
   - Login (`/api/auth/login`)
   - AI Co-Founder or other protected endpoints (with token)

4. If any step fails, fix the cause (env, DB, auth) and re-run.

---

## 3. Optional: Cron jobs (Vercel)

If you use Vercel Cron (e.g. `vercel.json`):

- In **Vercel Dashboard** → **Settings** → **Cron Jobs**, confirm the schedule and that `CRON_SECRET` is set.
- Test manually:  
  `POST https://payaid-v3.vercel.app/api/cron/your-job`  
  Header: `Authorization: Bearer <CRON_SECRET>`.

---

## 4. Manual intervention required (you must do these)

These steps **cannot** be automated from the repo; they require your Vercel and Supabase dashboards:

| # | Step | Where | What to do |
|---|------|--------|------------|
| 1 | Set `DATABASE_URL` | Vercel → payaid-v3 → Settings → Environment Variables | Paste your **Supabase pooled** URI (Connection pooling, port 6543). Add to Production (and Preview if needed). |
| 2 | Set `CRON_SECRET` (optional) | Same | If you use cron jobs, add a secret and use it in `Authorization: Bearer <CRON_SECRET>` when calling cron endpoints. |
| 3 | Get pooled URI | Supabase → Project Settings → Database | Under **Connection pooling**, copy the URI (Transaction or Session mode, port **6543**). Do **not** use the direct connection (port 5432) on free tier. |
| 4 | Redeploy | Vercel → Deployments | After changing env vars, redeploy the latest deployment (or push a commit) so the new vars are applied. |

After you complete the table above, run the verification script (section 2) to confirm health, login, and AI Co-Founder.

---

## 5. References

- `scripts/verify-deployment.ps1` – PowerShell verification script (Windows).
- `scripts/verify-deployment.ts` – Cross-platform verification (`npx tsx scripts/verify-deployment.ts`).
- `TODO_STATUS.md` – AI Co-Founder and DB fix notes.
- `docs/NEXT_STEPS_ROADMAP.md` – Next steps after deployment.
