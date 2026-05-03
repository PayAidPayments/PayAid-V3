# Frappe → PayAid Sales Studio rebrand (Custom Script)

Apply this in **Frappe Admin** so Sales Studio feels revenue-focused (Pipeline / Sequences / Forecast), not generic "CRM".

**Where to paste:** Frappe site **Setup → Customization → Custom Script** (or **Customize Form** / **List View Settings** where applicable).  
**Site:** `crm.localhost` (or your Sales Studio site).

---

## 1. List view labels (Pipeline Coverage, My Opportunities)

```javascript
// Rename "Leads" to "Pipeline Coverage", "Deals"/Opportunity to "My Opportunities"
frappe.listview_settings['Lead'] = {
  label: 'Pipeline Coverage'
};

frappe.listview_settings['Deal'] = {
  label: 'My Opportunities'
};

// If your Frappe CRM uses "Opportunity" doctype instead of "Deal":
frappe.listview_settings['Opportunity'] = {
  label: 'My Opportunities'
};
```

If the list view still shows the old label, use **Customize** (Form/List) in Frappe to set the DocType **Label** to "Pipeline Coverage" or "My Opportunities".

---

## 2. Form labels (optional)

```javascript
frappe.ui.form.on('Lead', {
  refresh(frm) {
    // Optional: change section label
    frm.meta.description = 'Pipeline Coverage';
  }
});
```

---

## 3. Desk / app title

In **Desk Customization** or via script:

```javascript
// Set app title to PayAid Sales Studio (run in browser console once or via Custom Script)
if (typeof frappe !== 'undefined') {
  frappe.provide('frappe.desktop');
  frappe.desktop.title = 'PayAid Sales Studio';
  document.title = 'PayAid Sales Studio - Pipeline & Forecast';
}
```

Or in **Workspace**: rename the CRM workspace to **"Sales Studio"** and set its title to **PayAid Sales Studio**.

---

## 4. Sidebar focus (hide generic CRM wording)

- In **Workspace** settings, prefer labels: **Pipeline Coverage**, **Sequences**, **Forecast**, **Quotas**, **My Opportunities**.
- Hide or rename **Contacts** / **Organizations** to **Account Contacts** / **Key Accounts** if you want a rep-centric view.

---

## 5. Shell iframe title (already done)

The PayAid shell sets the page title to **"PayAid Sales Studio - Pipeline & Forecast"** in `app/sales-studio/[slug]/layout.tsx` (`metadata.title`). No Frappe change needed for that.

---

## Test

- Open **http://crm.localhost:8000/app/crm** (or from shell **Sales Studio**).
- Confirm list views show **Pipeline Coverage** / **My Opportunities** where applicable.
- Confirm no "CRM Portal" or "Frappe CRM" as primary title; **PayAid Sales Studio** in shell title.

---

## References

- [SALES-STUDIO-FRAPPE-PLAN.md](./SALES-STUDIO-FRAPPE-PLAN.md)
- [.cursor/rules/crm-vs-sales-studio.mdc](../.cursor/rules/crm-vs-sales-studio.mdc)
