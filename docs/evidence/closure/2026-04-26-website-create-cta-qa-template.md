# Website Create CTA QA Evidence (Template)

Use this template to capture quick validation for the Website create CTA fixes.

---

## Environment

- Date (YYYY-MM-DD):
- Tester:
- Tenant ID:
- Base URL:
- Branch/commit:
- Browser:

---

## Scope

- `apps/dashboard/app/website-builder/[tenantId]/Home/page.tsx`
- `apps/dashboard/app/ai-studio/[tenantId]/Websites/page.tsx`

Expected outcome: no silent no-op on create; user always gets clear progress/error/success feedback.

---

## Test Checklist

### 1) Website Builder create form validation UX

- [ ] Open `/website-builder/{tenantId}/Home` and click `Create Website`.
- [ ] Enter site name only -> slug auto-generates.
- [ ] Clear/invalid slug -> inline validation appears; `Create` disabled with clear reason.
- [ ] Duplicate slug -> duplicate warning appears and suggested slug action is visible.
- [ ] Click suggested slug -> slug updates to available value.

Evidence notes:

---

### 2) Website Builder submit behavior

- [ ] Valid form submit shows in-flight status (`Creating website...` / `Creating...`).
- [ ] Form controls are disabled while request is pending.
- [ ] Success navigates to `/website-builder/{tenantId}/Sites/{id}`.

Evidence notes:

---

### 3) Website Builder failure behavior

- [ ] Server-side validation error shows explicit inline message.
- [ ] Duplicate/slug error is visible inline (not silent).
- [ ] Timeout/network/auth errors show actionable messages (no no-op behavior).

Evidence notes:

---

### 4) AI Studio Websites modal parity

- [ ] Open `/ai-studio/{tenantId}/Websites` and trigger a failing create case.
- [ ] Inline error is shown in modal (not silent no-op).
- [ ] Retry flow works after editing fields.

Evidence notes:

---

## Result Summary

- Overall status: PASS / FAIL
- Blocking issues:
- Follow-up actions:

---

## Attachments

- Screenshot/video paths:
- Console/network evidence paths (optional):
- Related artifact paths:

