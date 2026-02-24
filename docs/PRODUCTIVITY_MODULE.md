# PayAid Productivity Module

Productivity is a **top-level module** (like CRM, Finance, HR). Users open it from the main nav and switch between 6 tools via tabs—no sidebar inside Productivity.

## Structure

- **Main nav:** Home | CRM | Finance | HR | **Productivity** | Analytics | Settings
- **Route:** `/productivity` → redirects to `/productivity/[tenantId]/sheets`
- **Tabs:** PayAid Sheets | PayAid Docs | PayAid Slides | PayAid Drive | PayAid Meet | PayAid PDF

All third-party names (Nextcloud, ONLYOFFICE, Jitsi) are hidden in the UI; everything is branded as PayAid.

## Tool URLs (white-labeled)

| PayAid name   | Tech (hidden)     | URL / proxy |
|---------------|-------------------|------------|
| PayAid Sheets | Nextcloud/ONLYOFFICE | `/api/productivity/proxy/office/s?tenantId=&token=` |
| PayAid Docs   | Nextcloud/ONLYOFFICE | `/api/productivity/proxy/office/d?tenantId=&token=` |
| PayAid Slides | Nextcloud/ONLYOFFICE | `/api/productivity/proxy/office/p?tenantId=&token=` |
| PayAid Drive  | Nextcloud Files   | `/api/productivity/proxy/drive?tenantId=&token=` |
| PayAid Meet   | Jitsi             | `NEXT_PUBLIC_MEET_BASE_URL` (e.g. `https://meet.payaid.app`) |
| PayAid PDF    | pdf-lib / PDF.js  | In-app; no iframe |

## Env vars

- `OFFICE_SERVER_URL` – Nextcloud/ONLYOFFICE document server (Sheets, Docs, Slides).
- `DRIVE_SERVER_URL` – Optional; defaults to `OFFICE_SERVER_URL/files` if unset.
- `NEXT_PUBLIC_MEET_BASE_URL` – Jitsi instance (e.g. `https://meet.payaid.app`).

## Security

- **JWT verification:** The office and drive proxy routes verify the JWT (from query `token` or `Authorization: Bearer`) before redirecting. They ensure the token is valid, not expired, that `tenantId` matches the payload, and that the tenant has access to the Productivity module. See `lib/productivity/verify-proxy-token.ts`.

## White-labeling

- **CSS:** `/productivity-white-label.css` – inject into the document server wrapper or proxy response to hide third-party logos/text.
- **Jitsi:** On your Jitsi Docker/server set `APP_NAME="PayAid Meet"` and remove Jitsi watermark via config.
- **PDF:** Implemented in-app; no external branding.

## Deployment

1. **Document server:** Run Nextcloud + ONLYOFFICE (or ONLYOFFICE Document Server) on a VPS; set `OFFICE_SERVER_URL`.
2. **Jitsi:** Run Jitsi Docker; point `NEXT_PUBLIC_MEET_BASE_URL` to it; use custom domain `meet.payaid.app` and rebrand.
3. **PDF:** No extra deployment; uses pdf-lib/PDF.js in the app.

## Document Builder

- **Route:** `/productivity/[tenantId]/builder` (tab: Document Builder).
- **API:** `POST /api/productivity/builder` with `tenantId`, `templateId`, `contactId`, `invoiceId`. Set `DOCUMENT_BUILDER_URL` to enable generation.
- **Templates:** Invoice (Finance), Offer letter (HR), Proposal/Contract (CRM). Data source: CRM contacts, Finance invoices.

## ONLYOFFICE enhancements

- **Document Builder** – Implement backend that calls ONLYOFFICE or fills DOCX templates; see `docs/ONLYOFFICE_ENHANCEMENTS.md`.
- **Plugins** – PayAid Contacts, WhatsApp share, AI summary (upload to Document Server).
- **Forms** – HR onboarding, expense claims; enable `forms` in Document Server config.
- **Track changes / version history** – Enable `trackChanges`, `macros`, `plugins` in config.

See `docs/ONLYOFFICE_ENHANCEMENTS.md` and ONLYOFFICE API/WOPI docs for deep integration.
