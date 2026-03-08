# Prisma Studio – "Unable to init PersistenceStore" / Fatal Error

When Studio shows **Fatal Error** with details **"Unable to init PersistenceStore undefined"**, it’s because the browser’s IndexedDB (used for UI state) failed to init. Fix it by clearing that data or using a new origin.

---

## Option A: Delete IndexedDB for this origin (recommended)

1. Open **http://localhost:5555** (with Studio running).
2. Press **F12** → open the **Application** tab (Chrome/Edge) or **Storage** (Firefox).
3. In the left sidebar, expand **IndexedDB**.
4. Find the database used by Prisma Studio (often `prisma-studio`, `Prisma Studio`, or the hostname).
5. Right‑click it → **Delete database**.
6. Close the tab and open **http://localhost:5555** again (or click **Reload Studio**).

---

## Option B: Use a different port (fresh origin, no old data)

Use a port that has no existing IndexedDB for this project:

```bash
npx prisma studio --port 5556
```

Then open **http://localhost:5556**. No previous Studio data exists for this origin, so PersistenceStore should init cleanly.

- Script: `npm run db:studio:clean` (runs Studio on port 5556).

---

## Option C: Use a private/incognito window

Open an **Incognito** (Chrome) or **Private** (Edge/Firefox) window and go to **http://localhost:5555**. That uses a clean storage profile with no existing IndexedDB.

---

## If it still fails (same error on 5556, incognito, etc.)

- Ensure only one Prisma Studio process is running (close other terminals that ran `prisma studio`).
- **Try a different browser**: Open the Studio URL in **Firefox** or **Edge** instead of Chrome (or vice versa). IndexedDB behavior can differ per browser; if Studio fails in one, it often works in another.
- On Windows, if the project is on a network/synced drive, run Studio from a local disk path.

---

## Option D: Use a Postgres client instead of Prisma Studio (reliable workaround)

If PersistenceStore fails in every browser/port, use your existing **`DATABASE_URL`** from `.env` in a standalone database client. You can view and edit the same data without Prisma Studio.

1. **pgAdmin** (free): [pgadmin.org](https://www.pgadmin.org/) — Add a server with your `DATABASE_URL` (host, port, user, password, database).
2. **TablePlus** (free tier): [tableplus.com](https://tableplus.com/) — Create a new PostgreSQL connection using the same credentials.
3. **DBeaver** (free): [dbeaver.io](https://dbeaver.io/) — New connection → PostgreSQL → paste or enter host, port, database, user, password from `DATABASE_URL`.
4. **VS Code / Cursor**: Install the **PostgreSQL** or **Database Client** extension and connect with `DATABASE_URL`.

**Connection details** from `DATABASE_URL`:

- Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`
- Use HOST, PORT, DATABASE, USER, PASSWORD in the client. If the URL has `?schema=public`, the schema to open is `public`.

This avoids IndexedDB/browser issues entirely.
