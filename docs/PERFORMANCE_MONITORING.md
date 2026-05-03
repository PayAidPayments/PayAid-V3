# Financial Dashboard – Performance monitoring (optional)

**Status:** Optional  
**When:** After Financial Dashboard Steps 1–9 are complete (see `TODO_LIST_FINANCIAL_DASHBOARD.md`).

---

## What it does

The setup script:

- Writes a **config file** for query performance, materialized view refresh, API response times, and alerts.
- Generates **SQL** for monitoring tables (e.g. `performance_metrics`, `slow_query_log`, `api_response_log`) and **middleware** code you can plug into API routes.
- Does **not** apply migrations automatically; you review and apply the generated SQL to your Postgres database if you want persistence.

---

## How to run

1. Ensure `DATABASE_URL` is set in `.env`.
2. From project root:
   ```bash
   npx tsx scripts/setup-performance-monitoring.ts
   ```
3. Review the generated files (config, SQL, middleware snippet).
4. If you use the SQL: run it against your Postgres DB (the script may use syntax that needs adjustment for your schema, e.g. `INDEX` in table definition is MySQL-style; Postgres uses `CREATE INDEX` separately).
5. Optionally wire the middleware into financial API routes and add an admin dashboard for metrics.

---

## References

- `scripts/setup-performance-monitoring.ts`
- `TODO_LIST_FINANCIAL_DASHBOARD.md` (Step 10)
