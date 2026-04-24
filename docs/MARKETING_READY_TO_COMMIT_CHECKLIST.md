# Marketing Ready-to-Commit Checklist

Use this gate before creating a Marketing-only production commit.

## Release Gate (must all be true)

- [ ] Step 4.1-4.5 in `docs/VERCEL_PRODUCTION_TESTING_HANDOFF.md` has authenticated QA status filled.
- [ ] Step 4.5b (X/Twitter media runtime verification) is completed.
- [ ] Evidence file is completed:
  - `docs/evidence/closure/2026-04-24-marketing-step4-authenticated-qa-template.md`
- [ ] No `FAIL` items remain for Marketing P0 flows (`Compose`, `History`, `Channels`, YouTube/X dispatch paths).
- [ ] Any `PARTIAL` items have explicit workaround and owner/date.

## Marketing-Only Commit Scope (include)

### API + Worker

- `apps/dashboard/app/api/social/posts/route.ts`
- `apps/dashboard/app/api/social/posts/export/route.ts`
- `apps/dashboard/app/api/social/posts/failure-analytics/route.ts`
- `apps/dashboard/app/api/social/posts/retry-bulk/route.ts`
- `apps/dashboard/app/api/social/posts/retries/route.ts`
- `apps/dashboard/app/api/social/posts/[id]/retry/route.ts`
- `apps/dashboard/app/api/social/posts/[id]/dispatch-audit/route.ts`
- `apps/dashboard/app/api/settings/social/route.ts`
- `apps/dashboard/app/api/settings/social/connect/route.ts`
- `apps/dashboard/app/api/settings/social/test/route.ts`
- `apps/dashboard/app/api/settings/social/disconnect/route.ts`
- `apps/dashboard/app/api/settings/social/refresh/route.ts`
- `server/workers/social-post-dispatch.ts`
- `lib/integrations/social-provider-aliases.ts`

### Marketing UI / Routes

- `components/marketing/MarketingStudioForm.tsx`
- `components/marketing/MarketingHistoryPage.tsx`
- `apps/dashboard/app/marketing/[tenantId]/Studio/page.tsx`
- `apps/dashboard/app/marketing/[tenantId]/History/page.tsx`
- `apps/dashboard/app/marketing/[tenantId]/Campaigns/page.tsx`
- `apps/dashboard/app/marketing/[tenantId]/Social-Media/page.tsx`
- `apps/dashboard/app/marketing/[tenantId]/Social-Media/Create-Post/page.tsx`
- `apps/dashboard/app/marketing/[tenantId]/Social-Media/Create-Image/page.tsx`
- `apps/dashboard/app/marketing/[tenantId]/social/new/page.tsx`
- `apps/dashboard/app/marketing/[tenantId]/social/page.tsx`
- `apps/dashboard/app/marketing/[tenantId]/studio-builder/page.tsx`
- `apps/dashboard/app/marketing/[tenantId]/Home/page.tsx`
- `lib/marketing/marketing-top-bar-items.ts`

### Documentation / Evidence

- `docs/MARKETING_ROUTE_CANONICAL_MAP.md`
- `docs/VERCEL_PRODUCTION_TESTING_HANDOFF.md`
- `docs/PAYAID_V3_PENDING_ITEMS_PRIORITY_CHECKLIST.md`
- `docs/evidence/closure/2026-04-24-marketing-step4-local-execution-pass-1.md`
- `docs/evidence/closure/2026-04-24-marketing-step4-authenticated-qa-template.md`

## Explicit Non-Marketing Exclusions (do not include in Marketing commit)

- Sales module changes (`apps/dashboard/app/sales/**`, `docs/SALES_*`)
- Logo/Brand Kit changes (`components/logo/**`, `apps/dashboard/app/api/logos/**`, `docs/LOGO_*`)
- Website Builder changes (`apps/dashboard/app/website-builder/**`, `apps/dashboard/app/api/website/**`, `docs/WEBSITE_*`)
- Broad CRM/HR/Finance unrelated updates
- Prisma/schema migrations not required by Marketing changes

## Commit Readiness Output

When all checks pass, record:

- Final recommendation: `Go | Conditional Go | No-Go`
- Commit scope: `Marketing-only`
- QA evidence links:
  - `docs/evidence/closure/2026-04-24-marketing-step4-authenticated-qa-template.md`
  - Any additional dated runtime artifacts/screenshots
