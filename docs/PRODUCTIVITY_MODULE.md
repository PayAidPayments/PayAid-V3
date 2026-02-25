# PayAid Productivity Module

Productivity is a **top-level module** (like CRM, Finance, HR). Users open it from the main nav and switch between tools via tabs—no sidebar inside Productivity.

## Structure

- **Main nav:** Home | CRM | Finance | HR | **Productivity** | Analytics | Settings
- **Route:** `/productivity` → redirects to `/productivity/[tenantId]/sheets`
- **Tabs:** PayAid Sheets | PayAid Docs | PayAid Slides | PayAid Drive | PayAid Meet | PayAid PDF | Document Builder

## Tool URLs

| PayAid name   | Implementation | URL / behavior |
|---------------|-----------------|----------------|
| PayAid Sheets | Built-in x-spreadsheet | Redirects to `/spreadsheet/[tenantId]/Spreadsheets` (list + editor) |
| PayAid Docs   | Coming soon     | Placeholder card; use Dashboard for now |
| PayAid Slides | Coming soon     | Placeholder card; use Dashboard for now |
| PayAid Drive  | Nextcloud Files (optional) | `/api/productivity/proxy/drive?tenantId=&token=` when `DRIVE_SERVER_URL` is set |
| PayAid Meet   | Jitsi           | `NEXT_PUBLIC_MEET_BASE_URL` (e.g. `https://meet.payaid.app`) |
| PayAid PDF    | pdf-lib (in-app)| In-app; no iframe |
| Document Builder | Optional service | `POST /api/productivity/builder`; set `DOCUMENT_BUILDER_URL` to enable |

## Env vars

- `DRIVE_SERVER_URL` – Optional; for PayAid Drive iframe (e.g. Nextcloud Files).
- `NEXT_PUBLIC_MEET_BASE_URL` – Jitsi instance (e.g. `https://meet.payaid.app`).
- `DOCUMENT_BUILDER_URL` – Optional; for Document Builder (templates + CRM/Finance data).

## Security

- **JWT verification:** The drive proxy verifies the JWT (from query `token` or `Authorization: Bearer`) before proxying. See `lib/productivity/verify-proxy-token.ts`.

## Deployment

- **PayAid Sheets:** No extra deployment; uses the built-in spreadsheet module (x-spreadsheet) and `/api/spreadsheets`.
- **PayAid Meet:** Deploy Jitsi separately; set `NEXT_PUBLIC_MEET_BASE_URL`.
- **PayAid Drive:** Set `DRIVE_SERVER_URL` if you use an external file server.
- **PayAid PDF:** In-app; no extra deployment.
