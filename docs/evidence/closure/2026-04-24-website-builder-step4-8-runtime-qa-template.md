# Website Builder Step 4.8 Runtime QA Template

**Date:**  
**Tester:**  
**Environment URL:**  
**Tenant ID/Slug:**  
**Role:**  

---

## Scope

Step 4.8 in:

- `docs/VERCEL_PRODUCTION_TESTING_HANDOFF.md`

Automation shortcuts:

- Runtime evidence pipeline: `npm run run:website-builder-step4-8-evidence-pipeline`
- Full release gate pack: `npm run run:website-builder-ready-to-commit-pack`

---

## UI flow checks

### 1) Module discoverability (switcher -> Website Builder)
- Started from non-Website Builder module: Yes/No
- `Website Builder` visible in module switcher secondary tools: Yes/No
- Click navigation landed on `/website-builder/[tenantId]/Home` (direct or redirect): Yes/No
- Pass/Fail:
- Evidence (screenshot/video):

### 2) Home list + filters
- Route opened: `/website-builder/[tenantId]/Home`
- Status filter result:
- Goal filter result:
- Refresh result:
- Pass/Fail:
- Evidence (screenshot/video):

### 3) Create site
- Payload used (name/slug/goal):
- Result:
- New card visible in Home list: Yes/No
- Pass/Fail:
- Evidence:

### 4) Open Site + detail metadata edit
- Route opened: `/website-builder/[tenantId]/Sites/[id]`
- Fields edited:
- Save result:
- Value persists after refresh: Yes/No
- Pass/Fail:
- Evidence:

### 5) Generate Draft + Apply Draft to Pages
- Generate Draft clicked: Yes/No
- Apply Draft clicked: Yes/No
- Page tree populated: Yes/No
- Success message shown: Yes/No
- Pass/Fail:
- Evidence:

### 6) Page-tree editor operations
- Renamed page title/slug/type: Yes/No
- Reordered with Up/Down: Yes/No
- Deleted one row: Yes/No
- Added one row: Yes/No
- Saved page tree: Yes/No
- Last save timestamp visible: Yes/No
- Unsaved changes badge behavior correct: Yes/No
- Pass/Fail:
- Evidence:

### 7) Guardrails
- Empty title blocked: Yes/No
- Duplicate slug blocked (case-insensitive): Yes/No
- Zero-page save blocked: Yes/No
- Inline validation details visible: Yes/No
- Pass/Fail:
- Evidence:

---

## API/runtime checks

Capture response summary and key fields (status code + critical JSON fields).

### A) `GET /api/website/sites`
- Status:
- Notes (`sites[]` shape / errors):
- Pass/Fail:

### B) `POST /api/website/sites`
- Status:
- Notes (`201` expected on valid payload):
- Pass/Fail:

### C) `GET /api/website/sites/:id`
- Status:
- Notes (metadata + compatibility mode):
- Pass/Fail:

### D) `PATCH /api/website/sites/:id` (metadata only)
- Status:
- `normalizedPageTree` observed:
- Pass/Fail:

### E) `PATCH /api/website/sites/:id` (with pageTree)
- Status:
- `normalizedPageTree` observed:
- Invalid payload rejection check (`400` + `details[]`): Yes/No
- Pass/Fail:

### F) `POST /api/website/ai/generate-draft`
- Status:
- `draft.pagePlan[]` observed: Yes/No
- Pass/Fail:

---

## Failures and blockers

1.  
2.  
3.  

---

## Final result for Step 4.8

- Result: PASS / PARTIAL / FAIL / NOT AVAILABLE
- Release impact: None / Low / Medium / High / Critical
- Recommended action:

