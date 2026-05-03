# Sales Studio – Next Steps (One by One)

Do these in order. Each step builds on the previous.

---

## Step 1: Confirm /sales-studio loads

**Goal:** Open the shell, go to Sales Studio, and confirm the iframe loads.

1. **Frappe is running:** From repo root:
   ```powershell
   docker compose -f frappe-sales/docker-compose.yml ps
   ```
   You should see `crm-frappe-1` with status **Up**. If not, run `docker compose -f frappe-sales/docker-compose.yml up -d` and wait a few minutes.

2. **Hosts:** Ensure `127.0.0.1 crm.localhost` is in `C:\Windows\System32\drivers\etc\hosts` (edit as Administrator if needed).

3. **Env:** In `apps/web/.env` you should have:
   ```env
   PAYAID_SALES_STUDIO_URL=http://crm.localhost:8000
   PAYAID_SALES_STUDIO_APP_PATH=crm
   ```
   (Default is now `crm` so the iframe loads the Frappe CRM desk.)

4. **Shell:** Start the web app (e.g. `pnpm dev` from repo root or `cd apps/web && pnpm dev`). Open http://localhost:3001 (or your shell URL).

5. **Test:** Log in if needed, then open **Sales Studio** from the module switcher (or go to `/sales-studio`). You should see:
   - Browser tab title: **PayAid Sales Studio - Pipeline & Forecast**
   - Iframe showing Frappe (login page or CRM desk). If you see a Frappe login, use **Administrator** / **admin** (or your Frappe credentials).

**If the iframe is blank or 404:** Set `PAYAID_SALES_STUDIO_APP_PATH=crm` in `apps/web/.env` and restart the dev server. Then move to Step 2.

---

## Step 2: Rebrand in Frappe

**Goal:** Apply the “Apply in Frappe” checklist so Sales Studio feels revenue-focused (no generic “CRM” / “Leads” branding).

1. Open **[SALES-STUDIO-REBRAND-FRAPPE.md](./SALES-STUDIO-REBRAND-FRAPPE.md)** and follow the **“Apply in Frappe”** checklist.
2. In **Frappe** (http://crm.localhost:8000): **Setup → Customization → Custom Script** (or **Customize → Custom Script**). Create a **Client Script**, set **DocType** = "Lead" (or blank), paste the script from **Option A** in that doc. Save.
3. Optional: **Workspace** (rename CRM to “Pipeline Coverage” or create “Sales Studio”); **Translator** (Leads → “Pipeline Coverage”, Deals → “My Opportunities”).
4. Reload `/sales-studio` in the shell and confirm the rebrand (title, labels, pipeline as focus).

---

## Step 3: Sync (Espo → Frappe)

**Goal:** Create Frappe API keys and add them to the shell so Espo webhooks can push Leads to Sales Studio.

1. **In Frappe:** Log in as Administrator. Open **User** list → open your API user (or Administrator). Go to **Settings** (or the user form) → **API Access** → **Generate Keys**. Copy the **API Key** and **API Secret** (show secret once).

2. **In `apps/web/.env`:** Add:
   ```env
   PAYAID_SALES_STUDIO_API_KEY=your_api_key_here
   PAYAID_SALES_STUDIO_API_SECRET=your_api_secret_here
   ```

3. **Tenant has Sales Studio:** Ensure the tenant you use has the Sales Studio module enabled (e.g. in your tenant/tenantModules setup) so that when Espo sends a webhook to `POST /api/webhooks/espo`, the hub will push the contact to Frappe as a Lead.

4. **Test (optional):** Send a test `POST /api/webhooks/espo` with `tenantId`, `email`, `name`, `entityType: "Contact"` or `"Lead"`; then check in Frappe that a Lead was created and that the Hub `ExternalContact` has `frappeLeadId` set.

---

## Step 4: WhatsApp relay

**Goal:** When using WAHA/Baileys, set the webhook URL so events are relayed to Frappe.

1. **Relay endpoint:** The shell exposes `POST /api/webhooks/whatsapp`, which forwards the body to Frappe’s `POST {PAYAID_SALES_STUDIO_URL}/api/method/crm.webhook.whatsapp`.

2. **Configure your WhatsApp gateway:** In WAHA, Baileys, or your provider’s dashboard, set the **webhook URL** to:
   ```text
   https://your-shell-domain/api/webhooks/whatsapp
   ```
   (Replace `your-shell-domain` with your actual shell URL, e.g. `https://app.payaid.com` or your ngrok URL for local testing.)

3. **Local test:** If the shell is at http://localhost:3001, use a tunnel (e.g. ngrok) and set the webhook to `https://your-ngrok-url/api/webhooks/whatsapp` so Frappe can receive the events.

4. **Frappe:** Ensure Frappe CRM’s WhatsApp integration (e.g. Frappe WhatsApp app) is configured to accept webhooks so it can process incoming messages and sequences.

---

*After Step 1, do Step 2; after Step 2, do Step 3; then Step 4.*
