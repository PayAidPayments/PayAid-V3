# Website Create CTA QA Evidence (Example PASS)

This is a **sample filled artifact** to show expected completion format.
Do not treat values in this file as real execution evidence.

---

## Environment

- Date (YYYY-MM-DD): `2026-04-26`
- Tester: `example-user`
- Tenant ID: `tenant_demo_001`
- Base URL: `http://localhost:3000`
- Branch/commit: `da997fa06`
- Browser: `Chrome 135`

---

## Scope

- `apps/dashboard/app/website-builder/[tenantId]/Home/page.tsx`
- `apps/dashboard/app/ai-studio/[tenantId]/Websites/page.tsx`

Expected outcome: no silent no-op on create; user always gets clear progress/error/success feedback.

---

## Test Checklist

### 1) Website Builder create form validation UX

- [x] Open `/website-builder/{tenantId}/Home` and click `Create Website`.
- [x] Enter site name only -> slug auto-generates.
- [x] Clear/invalid slug -> inline validation appears; `Create` disabled with clear reason.
- [x] Duplicate slug -> duplicate warning appears and suggested slug action is visible.
- [x] Click suggested slug -> slug updates to available value.

Evidence notes:
- Slug auto-filled from `Acme Services` to `acme-services`.
- Duplicate slug warning appeared with suggestion `acme-services-2` and one-click apply worked.

---

### 2) Website Builder submit behavior

- [x] Valid form submit shows in-flight status (`Creating website...` / `Creating...`).
- [x] Form controls are disabled while request is pending.
- [x] Success navigates to `/website-builder/{tenantId}/Sites/{id}`.

Evidence notes:
- CTA changed to `Creating...`.
- Navigation landed on `/website-builder/tenant_demo_001/Sites/site_123`.

---

### 3) Website Builder failure behavior

- [x] Server-side validation error shows explicit inline message.
- [x] Duplicate/slug error is visible inline (not silent).
- [x] Timeout/network/auth errors show actionable messages (no no-op behavior).

Evidence notes:
- Forced duplicate submit returned inline error (`Slug already taken`).
- Offline devtools simulation returned `Network error while creating website...`.
- Session-expired scenario showed `Session expired. Please sign in again.`

---

### 4) AI Studio Websites modal parity

- [x] Open `/ai-studio/{tenantId}/Websites` and trigger a failing create case.
- [x] Inline error is shown in modal (not silent no-op).
- [x] Retry flow works after editing fields.

Evidence notes:
- Invalid create returned inline red error in modal.
- Editing domain and re-submit succeeded.

---

## Result Summary

- Overall status: `PASS`
- Blocking issues: `none`
- Follow-up actions: `none`

---

## Attachments

- Screenshot/video paths:
  - `docs/evidence/screenshots/website-create-pass-1.png`
  - `docs/evidence/screenshots/website-create-pass-2.png`
- Console/network evidence paths (optional):
  - `docs/evidence/network/website-create-network-sample.har`
- Related artifact paths:
  - `docs/evidence/closure/2026-04-26-website-create-cta-qa-template.md`
  - `docs/evidence/closure/2026-04-26-website-create-cta-qa-execution-draft.md`
  - `docs/evidence/closure/2026-04-26-website-create-cta-qa-closure-summary-template.md`

