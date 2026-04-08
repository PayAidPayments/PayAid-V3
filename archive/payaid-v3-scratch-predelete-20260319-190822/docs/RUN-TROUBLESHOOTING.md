# Run & Troubleshooting

Quick fixes for common issues when running the shell, CRM, Finance, and Sales Studio.

---

## Standalone vs web app (shell)

| How you use it | URL | What it is |
|----------------|-----|------------|
| **Web app (shell)** | **http://localhost:3001** | Main PayAid app (apps/web). You log in here, use the module switcher, and open **CRM**, **Finance**, or **Sales Studio** inside the shell (each module loads in an iframe). This is the normal way to use PayAid. |
| **Standalone** | http://localhost:3003 (CRM), http://localhost:3004 (Finance), http://crm.localhost:8000 (Sales Studio) | Opening a module **directly** in the browser, without going through the shell. Use standalone for: first-time install/setup, admin, or testing that the fork works. The same CRM/Finance/Sales Studio process serves both the shell iframe and the standalone URL. |

- **Rebrand (logo, footer, favicon)** applies to the module itself, so you see it both when using the **shell** (iframe) and when opening the module **standalone**. For CRM, run `.\scripts\copy-crm-rebrand-into-container.ps1` from repo root so the container serves PayAid branding.

---

## Run in this order (copy-paste)

**1. Sales Studio (Frappe) – crm.localhost:8000**
```powershell
cd "D:\Cursor Projects\PayAid V3\payaid-v3-scratch\frappe-sales"
docker compose up -d
```
Add `127.0.0.1   crm.localhost` to `C:\Windows\System32\drivers\etc\hosts` (as Admin) if not already there. First run can take 5+ minutes; check with `docker compose logs -f frappe`.

**2. PayAid Finance – localhost:3004 (login/register need API on 3000)**
```powershell
cd "D:\Cursor Projects\PayAid V3\payaid-v3-scratch\apps\payaid-finance"
docker compose up -d
pnpm run dev:server
```
Leave that terminal running. In a **second terminal**:
```powershell
cd "D:\Cursor Projects\PayAid V3\payaid-v3-scratch\apps\payaid-finance"
pnpm run dev:webapp
```
Then open http://localhost:3004 and use **Sign up** to create your first user.

**3. PayAid CRM – localhost:3003**
```powershell
cd "D:\Cursor Projects\PayAid V3\payaid-v3-scratch\apps\payaid-crm"
docker compose down
docker compose up -d
```
Open http://localhost:3003. To show PayAid logo/footer/favicon, from repo root run: `.\scripts\copy-crm-rebrand-into-container.ps1` then hard-refresh (Ctrl+Shift+R).

---

## 1. Sales Studio (Frappe) – ERR_EMPTY_RESPONSE or ERR_CONNECTION_REFUSED

**ERR_EMPTY_RESPONSE on http://localhost:8000 or http://localhost:8000/crm**

- **Cause 1 – Wrong hostname:** The Frappe site is created as **crm.localhost**. Frappe only serves requests when the browser sends `Host: crm.localhost`. If you open **http://localhost:8000**, the Host header is `localhost`, so Frappe sends no response → ERR_EMPTY_RESPONSE.
- **Cause 2 – Server not ready:** First-time setup (bench init, get-app crm, build, new-site) can take **5–10+ minutes**. Until `bench start` runs, nothing listens on port 8000.

**Fix:**

1. **Use the correct URL:** Open **http://crm.localhost:8000** and **http://crm.localhost:8000/app/crm** for the CRM app (or **http://crm.localhost:8000/app** then click CRM in the sidebar). Do **not** use `http://localhost:8000`.

2. **Make `crm.localhost` resolve** (Windows):
   - Open **Notepad as Administrator**, open `C:\Windows\System32\drivers\etc\hosts`.
   - Add a line: `127.0.0.1   crm.localhost`
   - Save.

3. **If still no response**, first-time setup may still be running. Check progress:
   ```powershell
   cd "D:\Cursor Projects\PayAid V3\payaid-v3-scratch\frappe-sales"
   docker compose logs -f frappe
   ```
   Wait until you see `bench start` and the web process listening. Then open **http://crm.localhost:8000**. Login: **Administrator** / **admin**.

4. **Start Frappe** if you haven’t:
   ```powershell
   cd "D:\Cursor Projects\PayAid V3\payaid-v3-scratch\frappe-sales"
   docker compose up -d
   ```
   Then add the hosts entry (step 2) and use **http://crm.localhost:8000** (step 1).

If the container **exits** (e.g. Python/ast error or "No module named 'frappe'"), pin the image to **`frappe/bench:v5.26.0`** in `frappe-sales/docker-compose.yml` (see SALES-STUDIO-FRAPPE-PLAN.md). If even v5.26.0 uses Python 3.14, use the **alternative** in that doc (frappe_docker or kaustubhn/frappe-crm-docker). If **yarn** fails with ESOCKETTIMEDOUT, retry on a better network; compose sets `YARN_NETWORK_TIMEOUT=300000`. If it exits with **Cannot find module 'socket.io'** (socketio crash), the repo's `init.sh` now removes socketio from the Procfile—recreate the container so the updated script runs: `docker compose up -d --force-recreate frappe`, then `docker compose logs -f frappe`.

---

## 1b. Sales Studio – “There’s nothing here” / “page gone missing” on /crm

**Symptom:** You open **http://crm.localhost:8000/crm** and see “There’s nothing here”, “The page you are looking for has gone missing”, or “Built on Frappe” with an empty content area.

**Cause:** On some Frappe setups the standalone path `/crm` is not the app entry; the CRM **workspace** is under the desk at **/app/crm**.

**Fix:**

1. **Use the desk workspace URL:** Open **http://crm.localhost:8000/app/crm** instead of `.../crm`. The shell iframe was updated to use `/app/crm` so Sales Studio from the shell should load correctly.
2. **Standalone:** If you bookmarked or use `.../crm` directly, switch to **http://crm.localhost:8000/app** and click **CRM** in the sidebar, or go to **http://crm.localhost:8000/app/crm**.
3. **If /app/crm also shows nothing:** Ensure the CRM app was installed on the site (init.sh runs `bench --site crm.localhost install-app crm`). Check container logs for errors during `install-app crm`; if it failed, you may need to recreate the container or run the install step manually inside the container.

---

## 2. http://localhost:3004/auth/login – Does not go to next page / Register “goes in rounds”

**Cause:** The **Finance API server** is not running. The webapp on port 3004 proxies `/api` to **localhost:3000**. If nothing is listening on 3000, login and register requests fail and the page never advances.

**Fix:**

1. **Terminal 1 – start the API server first:**
   ```powershell
   cd "D:\Cursor Projects\PayAid V3\payaid-v3-scratch\apps\payaid-finance"
   pnpm run dev:server
   ```
   Wait until you see the server listening (e.g. on port 3000).

2. **Terminal 2 – start the webapp:**
   ```powershell
   cd "D:\Cursor Projects\PayAid V3\payaid-v3-scratch\apps\payaid-finance"
   pnpm run dev:webapp
   ```

3. Ensure **Docker** is up for Finance DBs (MySQL, etc.):
   ```powershell
   cd "D:\Cursor Projects\PayAid V3\payaid-v3-scratch\apps\payaid-finance"
   docker compose up -d
   ```
   And that migrations have been run at least once: `pnpm run build:server` then `pnpm run system:migrate:latest`.

4. Open **http://localhost:3004**. Use **Sign up** to create your first organization and user; then **Log in** with those credentials.

---

## 3. http://localhost:3003 – ERR_EMPTY_RESPONSE or still shows EspoCRM logo/footer/favicon

**Cause:**  
- **ERR_EMPTY_RESPONSE:** Mounting the local fork (`.:/var/www/html`) breaks the container (image expects a different layout). The volume mount is **disabled** in `docker-compose.yml` so the app responds again.  
- **EspoCRM branding still visible:** The container uses the image’s built-in files. Apply the PayAid rebrand by copying our files into the running container.

**Fix:**

1. **Get the app responding (no volume mount):** In `apps/payaid-crm/docker-compose.yml` the `volumes` block is commented out. Recreate the stack:
   ```powershell
   cd "D:\Cursor Projects\PayAid V3\payaid-v3-scratch\apps\payaid-crm"
   docker compose down
   docker compose up -d
   ```
   Open http://localhost:3003 – you should see the CRM (with EspoCRM branding).

2. **Apply PayAid rebrand (logo, footer, favicon)** by copying our fork’s assets into the container. From **repo root**:
   ```powershell
   cd "D:\Cursor Projects\PayAid V3\payaid-v3-scratch"
   .\scripts\copy-crm-rebrand-into-container.ps1
   ```
   Then hard-refresh http://localhost:3003 (Ctrl+Shift+R). Re-run the script after any `docker compose up -d` that rebuilds the app container.

---

## Summary

| URL / App              | Requirement / Fix |
|------------------------|-------------------|
| **crm.localhost:8000** | Start `frappe-sales` with `docker compose up -d`; add `127.0.0.1 crm.localhost` to hosts. |
| **localhost:3004**     | Run **dev:server** (port 3000) first, then **dev:webapp** (3004); Docker + migrations done. |
| **localhost:3003**     | Volume mount in `apps/payaid-crm/docker-compose.yml` is on; run `docker compose down` then `up -d`; hard-refresh browser. |
