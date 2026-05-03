# Sales Studio Rebrand – Frappe (PayAid, No CRM)

**Goal:** Make Frappe feel like **HubSpot Sales Hub / Pipedrive**: **revenue-focused**, **rep-centric**, no "CRM" branding. Shell already shows **"PayAid Sales Studio"**; use the scripts below inside Frappe to finish the rebrand.

---

## Apply in Frappe (checklist)

1. **Confirm shell:** Open `/sales-studio` in the PayAid shell; tab title = "PayAid Sales Studio - Pipeline & Forecast". If iframe 404s, set `PAYAID_SALES_STUDIO_APP_PATH=crm` in `apps/web/.env`.
2. **Frappe Admin:** Log in to Frappe (e.g. http://crm.localhost:8000) as Administrator.
3. **Custom Script:** Go to **Setup → Customization → Custom Script** (or **Customize → Custom Script**). Create a new script, set **DocType** = "Lead" (or leave blank for global), **Script Type** = "Client", paste the script from **Option A** below. Save.
4. **Optional – Workspace:** Rename the CRM workspace to "Pipeline Coverage" or create a "Sales Studio" workspace with links to Pipeline, Sequences, Forecast, Quotas.
5. **Optional – Translator:** **Setup → Translation** – add translations for Leads → "Pipeline Coverage", Deals → "My Opportunities", etc.
6. **Test:** Reload `/sales-studio`; confirm no "CRM" or "Leads" as primary branding and Pipeline is the focus.

---

## Rebrand Map

| Current (Frappe CRM) | Sales Studio |
|----------------------|--------------|
| "Frappe CRM Portal"  | **PayAid Sales Studio** |
| "Leads"              | **Pipeline Coverage** |
| "Deals"              | **My Opportunities** |
| "Contacts"           | **Account Contacts** |
| "Organizations"      | **Key Accounts** |

---

## 1. Shell (Already Done)

- **Title:** `PayAid Sales Studio - Pipeline & Forecast` (set in `apps/web/app/sales-studio/[slug]/layout.tsx`).
- **Iframe:** Loads `${PAYAID_SALES_STUDIO_URL}/app/${PAYAID_SALES_STUDIO_APP_PATH}` (default `appPath = "crm"` for Frappe CRM desk). Set to `sales` only if you added a custom workspace.

---

## 2. Frappe Custom Script (Paste in Frappe Admin)

In **Frappe**: **Setup → Customization → Custom Script** (or **Customize Form** for per-doc labels). Add a **Client Script** that runs on load.

**Option A – Client script (recommended):** Create a **Client Script** with **DocType** = blank (or "Lead"), **Script Type** = "Document", and paste below. Or use **Custom Script** if your Frappe version has it.

```javascript
// PayAid Sales Studio – rebrand labels (no CRM)
frappe.listview_settings['Lead'] = {
  get_formatted_label: function(doc) {
    return doc.company_name || doc.lead_name || doc.name;
  }
};
// If your app uses "Deal" instead of "Opportunity", use:
// frappe.listview_settings['Deal'] = { ... };
frappe.listview_settings['Opportunity'] = frappe.listview_settings['Opportunity'] || {};
frappe.listview_settings['Opportunity'].formatters = frappe.listview_settings['Opportunity'].formatters || {};
frappe.listview_settings['Opportunity'].onload = function(listview) {
  listview.page.set_title('My Opportunities');
};

// Global title
frappe.router.on('change', function() {
  if (frappe.router.current_route && frappe.router.current_route[0] === 'app') {
    document.title = 'PayAid Sales Studio - Pipeline & Forecast';
  }
});
document.title = 'PayAid Sales Studio - Pipeline & Forecast';
```

**Option B – Rename sidebar / workspace (if your Frappe has “Workspace”):**

- **Workspace → CRM** (or “Leads”): rename to **“Pipeline Coverage”**.
- Create or rename a workspace **“Sales Studio”** with links: Pipeline Coverage, Sequences, Forecast, Quotas, Leaderboards.
- In **Desk** settings, set **App Title** to **“PayAid Sales Studio”** if the theme allows.

**Option C – Custom translations (Translator):**

- **Setup → Translation → New**:  
  - Source: `Leads` → Translation: `Pipeline Coverage`  
  - Source: `Deals` (or `Opportunity`) → Translation: `My Opportunities`  
  - Source: `Contacts` → Translation: `Account Contacts`  
  - Source: `Organizations` → Translation: `Key Accounts`  
- Apply to language “English” (or your default).

---

## 3. Feature Refocus (Master Plan)

**Sales Studio = Revenue Engine.** Prefer:

- **Homepage KPIs:** Pipeline Coverage %, Forecast (₹), Quota Progress %, Win Rate.
- **Primary sections:** Pipeline Coverage (Kanban), Sequences (WA/Email), My Opportunities, Rep Leaderboards, Sales Playbooks.
- **Soften or hide:** Contacts/Organizations as “Account Contacts” in a rep view, not as the main CRM hub.

Do this via **Workspace** and **Role Permissions** in Frappe (show only Pipeline, Sequences, Forecast, Quotas, Leaderboards to sales reps).

---

## 4. Test Checklist

- [ ] `/sales-studio` → browser title is **“PayAid Sales Studio - Pipeline & Forecast”**.
- [ ] No “CRM” or “Leads” in the main heading/sidebar (after Custom Script / Workspace / Translator).
- [ ] Pipeline / opportunities view is the primary experience.
- [ ] Switcher shows **CRM (Espo) | Sales Studio**.

---

## 5. Commit

Suggested message: `sales-studio-rebrand` or `docs(sales-studio): rebrand Frappe to PayAid Sales Studio`.

---

*Shell title and iframe path are in the repo; Frappe-side changes are applied in Frappe Admin (Custom Script / Workspace / Translator).*

---

## Cursor rebrand prompt (copy-paste)

```md
# REBRAND FRAPPE → PAYAID SALES STUDIO (NO CRM)

**PROBLEM**: Frappe shows "CRM Portal", "Leads", "Deals" → feels like duplicate CRM.

**SOLUTION**: Rebrand as "Sales Studio" focused on revenue metrics.

**TASKS**:
1. Shell iframe: src=`${PAYAID_SALES_STUDIO_URL}/app/sales` (or PAYAID_SALES_STUDIO_APP_PATH). Title: "PayAid Sales Studio".
2. Frappe Custom Script (in Frappe Admin): see docs/SALES-STUDIO-REBRAND-FRAPPE.md – listview labels "Pipeline Coverage", "My Opportunities", document.title "PayAid Sales Studio".
3. Hide CRM sections in Frappe: focus sidebar on Pipeline, Sequences, Forecast, Leaderboards.

**TEST**: /sales-studio → "PayAid Sales Studio" title; no "CRM" or "Leads" branding; Pipeline as primary view.
Commit "sales-studio-rebrand".
```
