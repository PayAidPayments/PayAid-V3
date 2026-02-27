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
| PayAid Docs   | Built-in (TipTap) | List at `/productivity/[tenantId]/docs`; editor at `.../docs/[id]` or `.../docs/new`; stores in `Document` model |
| PayAid Slides | Built-in          | List at `/productivity/[tenantId]/slides`; editor at `.../slides/[id]` or `.../slides/new`; present mode; stores in `Presentation` model |
| PayAid Drive  | Built-in        | List/upload/folders/download at `/productivity/[tenantId]/drive`; stores in `DriveFile`; files under `uploads/[tenantId]/` |
| PayAid Meet   | Built-in        | List + create/join at `/productivity/[tenantId]/meet`; room at `.../meet/room/[code]`; video via Jitsi when `NEXT_PUBLIC_MEET_BASE_URL` set |
| PayAid PDF    | Built-in (pdf-lib) | In-app view/new/merge/split at `/productivity/[tenantId]/pdf` |
| Document Builder | Built-in      | Template + CRM/Finance data at `/productivity/[tenantId]/builder`; generates PDF with pdf-lib. Optional: set `DOCUMENT_BUILDER_URL` to `https://your-builder/build` for external builder (we POST `{ templateId, tenantId, data }` and forward `downloadUrl` / `pdfBase64`) |

## Env vars

- `NEXT_PUBLIC_MEET_BASE_URL` – Optional; Jitsi (or other meet) URL for video in PayAid Meet room (e.g. `https://meet.payaid.app`). If not set, room page shows invite link only.
- `DOCUMENT_BUILDER_URL` – Optional; external Document Builder service. If not set, built-in pdf-lib generation is used.
- `DRIVE_SERVER_URL` – Optional; legacy; was used for Nextcloud Drive iframe. Built-in Drive no longer uses it.

## Security

- **JWT verification:** All productivity APIs and the builder use JWT (Bearer or proxy token). See `lib/productivity/verify-proxy-token.ts` for proxy/builder.

## Deployment

- **PayAid Sheets / Docs / Slides / Drive / PDF / Document Builder:** No extra deployment; all built-in with existing APIs and storage.
- **PayAid Meet:** Built-in list and room; set `NEXT_PUBLIC_MEET_BASE_URL` only if you want in-app video (e.g. Jitsi).
