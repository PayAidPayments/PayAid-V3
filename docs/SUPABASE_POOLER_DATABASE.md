# Supabase pooler – Prisma & DATABASE_URL

When using **Supabase’s connection pooler** (Session or Transaction mode) instead of the direct connection, the connection string **must** use a specific username format. Using the wrong format causes:

```text
FATAL: Tenant or user not found
```

---

## Fix: use the correct pooler connection string

The **username** in the URL must include your **project reference**, not just `postgres`.

| Mode              | Port | Username format      | Example host (region may vary)                    |
|-------------------|------|----------------------|---------------------------------------------------|
| **Session mode**  | 5432 | `postgres.[PROJECT_REF]` | `aws-1-ap-northeast-2.pooler.supabase.com`       |
| **Transaction**   | 6543 | `postgres.[PROJECT_REF]` | same                                              |

Wrong (will give “Tenant or user not found”):

```text
postgresql://postgres:YOUR_PASSWORD@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

Correct:

```text
postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

Replace `YOUR_PROJECT_REF` with your project’s reference ID (e.g. from the Supabase dashboard URL or **Settings → General → Reference ID**).

---

## Where to get the exact string

1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **Connect** (or go to **Settings → Database**).
3. Choose the pooler you use:
   - **Session mode** (port 5432) → use the “Session” / “Connection pooling” URI.
   - **Transaction mode** (port 6543) → use the “Transaction” URI.
4. Copy the **URI** and set it as `DATABASE_URL` in your `.env` (no need to change the username manually if you copy from the dashboard).

The dashboard-generated URI already uses `postgres.[project-ref]` as the user.

---

## Prisma and the pooler

- **`prisma db push`** and **`prisma migrate`** work with the pooler when the connection string is in the format above.
- If you still see “Tenant or user not found”, the most likely cause is `postgres` used as the username instead of `postgres.[PROJECT_REF]`. Double-check the URI from **Connect** / **Database** settings and that `DATABASE_URL` in `.env` matches it exactly (no accidental edits to the username part).

---

## Summary

| Issue                         | Cause                    | Fix                                                                 |
|------------------------------|--------------------------|---------------------------------------------------------------------|
| “Tenant or user not found”   | Wrong pooler username     | Use `postgres.[PROJECT_REF]` in the URI (or copy URI from dashboard) |
| Slow / hanging voice-agents   | DB connection/query slow | API now has a 12s timeout; fix `DATABASE_URL` so the pooler connects correctly |

Direct connection is not required; the pooler is supported as long as the connection string uses the correct format.
