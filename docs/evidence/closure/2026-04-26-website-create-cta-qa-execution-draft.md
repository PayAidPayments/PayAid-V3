# Website Create CTA QA Evidence (Execution Draft)

This draft is pre-filled from the current code hardening pass. Replace placeholders and checkboxes with actual QA outcomes.

---

## Environment

- Date (YYYY-MM-DD): `2026-04-26`
- Tester: `<name>`
- Tenant ID: `<tenant-id>`
- Base URL: `<url>`
- Branch/commit: `da997fa06` (plus local uncommitted follow-up UX refinements)
- Browser: `<browser + version>`

---

## Scope

- `apps/dashboard/app/website-builder/[tenantId]/Home/page.tsx`
- `apps/dashboard/app/ai-studio/[tenantId]/Websites/page.tsx`

Expected outcome: no silent no-op on create; user always gets clear progress/error/success feedback.

---

## Quick Run Commands

Use these during QA to gather supporting artifacts quickly.

```powershell
# Refresh canonical status panel/evidence before or after QA
npm run run:canonical-status-refresh
```

```powershell
# Optional: if you need current branch commit in notes
git rev-parse --short HEAD
```

Suggested test URLs:

- `/website-builder/{tenantId}/Home`
- `/ai-studio/{tenantId}/Websites`

---

## Test Checklist

### 1) Website Builder create form validation UX

- [ ] Open `/website-builder/{tenantId}/Home` and click `Create Website`.
- [ ] Enter site name only -> slug auto-generates.
- [ ] Clear/invalid slug -> inline validation appears; `Create` disabled with clear reason.
- [ ] Duplicate slug -> duplicate warning appears and suggested slug action is visible.
- [ ] Click suggested slug -> slug updates to available value.

Evidence notes:
- `<add notes>`

---

### 2) Website Builder submit behavior

- [ ] Valid form submit shows in-flight status (`Creating website...` / `Creating...`).
- [ ] Form controls are disabled while request is pending.
- [ ] Success navigates to `/website-builder/{tenantId}/Sites/{id}`.

Evidence notes:
- `<add notes>`

---

### 3) Website Builder failure behavior

- [ ] Server-side validation error shows explicit inline message.
- [ ] Duplicate/slug error is visible inline (not silent).
- [ ] Timeout/network/auth errors show actionable messages (no no-op behavior).

Failure-injection ideas:

- Duplicate slug: use a slug from an existing site card.
- Session/auth: remove/expire auth and retry create to verify session message.
- Timeout/network: simulate offline/slow network in browser devtools, then submit.

Evidence notes:
- `<add notes>`

---

### 4) AI Studio Websites modal parity

- [ ] Open `/ai-studio/{tenantId}/Websites` and trigger a failing create case.
- [ ] Inline error is shown in modal (not silent no-op).
- [ ] Retry flow works after editing fields.

Evidence notes:
- `<add notes>`

---

## Result Summary

- Overall status: `<PASS/FAIL>`
- Blocking issues: `<none or list>`
- Follow-up actions: `<none or list>`

---

## Attachments

- Screenshot/video paths:
  - `<path-1>`
  - `<path-2>`
- Console/network evidence paths (optional):
  - `<path-1>`
- Related artifact paths:
  - `docs/evidence/closure/2026-04-26-website-create-cta-qa-template.md`
  - `docs/evidence/closure/2026-04-26-website-create-cta-qa-execution-draft.md`

