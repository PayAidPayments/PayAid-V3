# ONLYOFFICE integration (Phase 11)

- **Docker:** `docker compose -f docker-compose.onlyoffice.yml up -d` → Document Server on `http://localhost:8080`.
- **Env:** `ONLYOFFICE_URL=http://localhost:8080` (or your public URL for production).
- **App:** Use `/docs/editor` to embed the editor:
  - Load document from Supabase storage (signed URL) or your API.
  - Pass `document.url` and `document.fileType` to ONLYOFFICE Document Server API (see [Document Server API](https://api.onlyoffice.com/editors/basic)).
  - Render the editor iframe with the config returned by Document Server (e.g. POST to `http://onlyoffice/document-server/web-apps/apps/api/documents/api.js` with document config).
- **Storage:** Save edited file back via ONLYOFFICE callback URL to your API, then upload to Supabase storage.

## /docs/editor route

Add a page or API that:

1. Resolves the document id (e.g. from query).
2. Gets a signed download URL from Supabase (or internal URL ONLYOFFICE can reach).
3. Calls ONLYOFFICE Document Server to get editor config (with `url`, `callbackUrl` for save).
4. Renders the iframe with that config.

No overhaul needed; stack scales. Focus integrations.
