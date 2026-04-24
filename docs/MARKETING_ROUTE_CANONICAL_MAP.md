# Marketing Route Canonical Map

Last updated: 2026-04-24

Purpose: keep Marketing IA consistent around **Compose / History / Channels** and prevent duplicate entry points from returning.

## Canonical routes

- Compose: `/marketing/[tenantId]/Studio`
- History: `/marketing/[tenantId]/History`
- Channels: `/marketing/[tenantId]/Social-Media`

## Legacy aliases (redirects)

- `/marketing/[tenantId]/Social-Media/Create-Post` -> `/marketing/[tenantId]/Studio?legacyRedirect=1`
- `/marketing/[tenantId]/Social-Media/Create-Image` -> `/marketing/[tenantId]/Studio?legacyRedirect=1`
- `/marketing/[tenantId]/social/new` -> `/marketing/[tenantId]/Studio?legacyRedirect=1`
- `/marketing/[tenantId]/studio-builder` -> `/marketing/[tenantId]/Studio?legacyRedirect=1`
- `/marketing/[tenantId]/social` -> `/marketing/[tenantId]/History`
- `/marketing/[tenantId]/Campaigns` -> `/marketing/[tenantId]/History`
- `/marketing/[tenantId]/channels` -> `/marketing/[tenantId]/Social-Media`

## UX behavior notes

- `legacyRedirect=1` is used only to trigger a one-time Compose banner for users coming from old bookmarks.
- The banner is session-scoped via `sessionStorage` and can be dismissed by the user.
- After banner handling, the URL is cleaned back to `/marketing/[tenantId]/Studio`.

## Guardrails for future changes

- New creation flows must link to `Studio` (Compose) instead of introducing new route branches.
- New status/reporting flows should prefer `History` unless they are channel-connection setup.
- Channel connection/setup and connector health pages should route from `Social-Media` (Channels).
