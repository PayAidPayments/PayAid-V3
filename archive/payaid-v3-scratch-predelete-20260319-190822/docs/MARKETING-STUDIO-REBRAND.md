# PayAid Marketing Studio – Rebrand & Independence

**Goal:** Refocus from generic Mautic (Contacts/Forms) to **PayAid Marketing Studio** (Campaigns/Social/ROI), with **standalone** (no CRM) and **integrated** (CRM + Sales Studio) modes via entitlements.

**Reference:** [MAUTIC-MARKETING-PLAN.md](./MAUTIC-MARKETING-PLAN.md), [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md).

---

## 1. Shell Rebrand (Done)

| Item | Value |
|------|--------|
| Module name | **Marketing Studio** |
| Description | Campaigns, ROI, social |
| Default route | `/marketing` → `/marketing/[slug]/**campaigns**` (campaigns-first, not dashboard) |
| Page title | **PayAid Marketing Studio - Campaigns & ROI** |
| Iframe title | PayAid Marketing Studio |

---

## 2. Mautic Customization (Admin – Manual)

Mautic itself still shows its default dashboard. To refocus on **Campaigns/Social/ROI**:

### 2.1 Dashboard widgets (Mautic Admin)

**Mautic → Reports → Dashboards → Edit default dashboard**

- **Remove (CRM-heavy):** Contacts Created, Form Submissions (or demote).
- **Add / prioritize:**
  - **Campaign ROI** (revenue / spend) – custom report or widget if available.
  - **Leads Generated** (forms + landing pages).
  - **Social Engagement** (likes, shares, comments).
  - **Email Performance** (open rate, click rate).
  - **WhatsApp Replies** (custom field / integration later).

### 2.2 Site title

**Mautic → Settings → Configuration → System Settings**

- **Site URL:** Keep as `http://localhost:8001` (or your PAYAID_MARKETING_URL).
- Where possible, set **Title** / **Application name** to **PayAid Marketing Studio**.

### 2.3 Sidebar priority

In Mautic menu, prioritize (order may be configurable or theme-dependent):

1. **Campaigns** (pin to top)
2. Social / Social Monitoring
3. Emails
4. Segments (or “Audiences”)
5. Assets (images/videos)
6. Reports
7. Contacts, Forms (lower or collapsed)

---

## 3. Module Independence (Entitlements)

**`Tenant.modules`** and **`TenantModule`** control which data sources Marketing uses.

### 3.1 Modes

| Tier | tenant_modules / modules | Data sources | Behavior |
|------|---------------------------|-------------|----------|
| **Marketing only** (e.g. ₹1999/mo) | `marketing` only | Hub **marketing_contacts** (CSV/manual) | No CRM sync. “Import contacts” (CSV) or “Quick Audiences” (manual lists). |
| **Marketing + CRM** (e.g. ₹3999/mo) | `crm`, `marketing` | Mautic segments ↔ Espo Contacts/Leads | Hub syncs Espo ↔ Mautic; Campaign ROI can map to Frappe Deals won. |
| **Full suite** | `crm`, `sales-studio`, `marketing`, … | All sync + AI content (future) | Mautic ↔ Hub ↔ Espo/Frappe; AI images/video via Hub. |

### 3.2 Fallback when no CRM

- **No CRM licensed** → Mautic uses:
  - **Hub `marketing_contacts`** (CSV upload via `/api/marketing/contacts` POST).
  - Form submissions (Mautic forms).
  - No Espo/Frappe sync; UI can show “Import contacts” or “Quick Audiences”.

### 3.3 Hub API behavior

- **GET /api/marketing/contacts**  
  Returns Hub **marketing_contacts** for the tenant (source filter: `csv` | `espo` | `frappe` when applicable).  
  When CRM is licensed, other APIs (e.g. CRM endpoints) can be used for Espo contacts; this one is for Marketing Studio audiences.

- **POST /api/marketing/contacts**  
  CSV or JSON import into **marketing_contacts** (source: `csv`). Optional later: push to Mautic when `MAUTIC_API_*` is set.

---

## 4. Hub Data Model

### 4.1 MarketingContact (Prisma)

```text
marketing_contacts:
  id, tenantId, email (unique per tenant), firstName, lastName, phone,
  source (csv | espo | frappe), mauticId (after push to Mautic), tags[], createdAt, updatedAt
```

- **Standalone:** Only `source = csv` (and manual).  
- **Integrated:** `source = espo | frappe` when synced from CRM; `mauticId` when pushed to Mautic.

### 4.2 Sync flows (future)

- **Marketing only:** CSV → Hub `marketing_contacts` → (optional) Mautic API.  
- **Marketing + CRM:** Mautic webhook → PayAid Hub → Espo/Frappe; Hub `external_contacts` + `marketing_contacts`; “Sync from CRM” → pull Espo contacts into segments.

---

## 5. Implementation Checklist

| Task | Status |
|------|--------|
| Shell: Marketing Studio title, campaigns default route, module name/desc | ✅ Done |
| Prisma: MarketingContact model | ✅ Done |
| GET /api/marketing/contacts | ✅ Done |
| POST /api/marketing/contacts (JSON + CSV multipart) | ✅ Done |
| Mautic Admin: dashboard widgets, site title, sidebar | Manual (doc above) |
| Entitlement: tenant_modules check in UI (e.g. “Sync from CRM” only if CRM) | Planned |
| Mautic API push on import (MAUTIC_API_* env) | Planned |
| ComfyUI / WhatsApp / AI content (Week 2) | Planned |

---

## 6. Run DB migration

After pulling the new schema:

```bash
pnpm db:push
# or from packages/db: pnpm run db:push
```

---

*Last updated: Marketing Studio rebrand (shell, Hub contacts API, doc).*
