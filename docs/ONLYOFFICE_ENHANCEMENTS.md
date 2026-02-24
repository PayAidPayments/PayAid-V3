# ONLYOFFICE Enhancements for PayAid V3

This doc covers Document Builder, plugins, forms, and config so PayAid Productivity can reach Zoho-level document workflows.

---

## 1. Document Builder API

**Purpose:** Auto-generate invoices, contracts, and offer letters from CRM/Finance data.

**PayAid implementation:**
- **UI:** `/productivity/[tenantId]/builder` – pick template (Invoice, Offer letter, Proposal, Contract), link Contact or Invoice, then "Generate document".
- **API:** `POST /api/productivity/builder` with `tenantId`, `templateId`, `contactId`, `invoiceId`. Verifies JWT and returns `fileId` or `downloadUrl` when `DOCUMENT_BUILDER_URL` is set.
- **Backend:** Set `DOCUMENT_BUILDER_URL` to your Document Builder service. That service should:
  1. Accept POST with template ID + data payload.
  2. Fetch contact/invoice from PayAid (or receive full JSON from our API).
  3. Call ONLYOFFICE Document Builder (or use docx/pdf templates + placeholders) to produce the file.
  4. Return file ID or signed download URL.

**ONLYOFFICE Document Builder (optional):**
- [Document Builder API](https://api.onlyoffice.com/docbuilder/basic) – `Asc.scope`, create document, insert text, save.
- Store templates (DOCX/XLSX) in Supabase or Drive; Builder loads template and fills placeholders from PayAid data.

---

## 2. Plugins (Document Server)

**Purpose:** Custom plugins inside PayAid Sheets/Docs: insert CRM data, WhatsApp share, AI summary.

**Suggested plugins:**
| Plugin        | Description                          | Implementation idea                                      |
|---------------|--------------------------------------|-----------------------------------------------------------|
| PayAid Contacts | Insert selected CRM contact into doc | Plugin UI → call PayAid API with JWT → paste name/email. |
| WhatsApp Share  | Share current doc link via WhatsApp  | Plugin opens `https://wa.me/?text=<encoded-url>`.       |
| AI Summary      | Summarize selection or full doc      | Plugin sends text to PayAid/Groq API → paste summary.    |

**Deployment:**
- Build plugin per [ONLYOFFICE plugin guide](https://www.onlyoffice.com/blog/2020/04/plugins-in-onlyoffice-a-quick-start-guide-for-developers).
- Upload to Document Server: `/var/www/onlyoffice/documentserver/sdkjs-plugins/` (or equivalent in Docker).
- Enable in Document Server config: `"plugins": true`.

---

## 3. Forms

**Purpose:** HR onboarding forms, expense claims – data bound to PayAid HR/Finance.

**Config (Document Server):**
- Enable forms: `"forms": true` in `config.json` (or equivalent).
- Create form templates in Docs; store in tenant Drive.
- PayAid backend can expose a **Forms API** that:
  - Lists available forms for the tenant.
  - Submits form data to HR (onboarding) or Finance (expense) APIs.

---

## 4. Document Server config (track changes, macros, plugins)

**Recommended defaults** for PayAid (edit on your Document Server instance):

```json
{
  "macros": true,
  "plugins": true,
  "forms": true,
  "trackChanges": true
}
```

- **trackChanges:** Required for CA/Finance review and compliance.
- **macros:** Enables scripted automation (e.g. GST calc, sum overdue).
- **plugins:** Required for PayAid Contacts / WhatsApp / AI plugins.
- **forms:** Required for onboarding and expense forms.

---

## 5. WOPI (optional)

**Purpose:** Open PayAid-stored files (e.g. invoice PDF) in the editor via WOPI protocol.

- Implement WOPI endpoints in PayAid: CheckFileInfo, GetFile, PutFile.
- Document Server uses these to load/save from PayAid storage (Supabase/Drive) instead of local disk.
- See [ONLYOFFICE WOPI](https://helpcenter.onlyoffice.com/development/document-builder/usage/using-wopi-protocol.aspx) and your Document Server integration guide.

---

## 6. Priority order

1. **Document Builder** – Already stubbed in PayAid; wire `DOCUMENT_BUILDER_URL` and template + data pipeline.
2. **Plugins** – Add PayAid Contacts and WhatsApp Share; then AI Summary.
3. **Forms** – Enable in config; add HR onboarding and Finance expense form templates and submission flow.
4. **Track changes / version history** – Enable in config; use for compliance and audit.
5. **WOPI** – When you need “open from PayAid Drive” in editor.

---

## Env reference

| Variable                 | Purpose |
|--------------------------|--------|
| `OFFICE_SERVER_URL`      | ONLYOFFICE Document Server base URL (Sheets, Docs, Slides). |
| `DRIVE_SERVER_URL`       | Optional; Drive/base files URL. |
| `DOCUMENT_BUILDER_URL`   | PayAid Document Builder service (generates from template + CRM/Finance data). |
| `NEXT_PUBLIC_MEET_BASE_URL` | Jitsi (PayAid Meet) URL. |
