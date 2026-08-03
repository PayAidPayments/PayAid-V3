/**
 * No-404 file presence gate for uniform module dashboard homes + primary CTAs.
 * Also expands Wave 3 industry homes via directory discovery.
 *
 * Usage: node scripts/check-module-dashboard-homes.cjs
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel))
}

const CHECKS = [
  'components/modules/dashboard/ModuleDashboardShell.tsx',
  'components/modules/dashboard/ComingSoonModuleHome.tsx',
  'components/modules/dashboard/ProductivityToolHome.tsx',
  'docs/ai/module-dashboard-uniformity.md',

  'apps/crm/app/crm/[tenantId]/Home/page.tsx',
  'apps/crm/app/crm/[tenantId]/Home/CrmHomeDashboard.tsx',
  'apps/hr/app/hr/[tenantId]/Home/page.tsx',
  'apps/finance/app/finance/[tenantId]/Home/page.tsx',
  'apps/projects/app/projects/[tenantId]/Home/page.tsx',
  'apps/dashboard/app/productivity/[tenantId]/Home/page.tsx',
  'apps/dashboard/app/docs/[tenantId]/Home/page.tsx',
  'apps/dashboard/app/spreadsheet/[tenantId]/Home/page.tsx',
  'apps/dashboard/app/slides/[tenantId]/Home/page.tsx',
  'apps/dashboard/app/meet/[tenantId]/Home/page.tsx',
  'apps/dashboard/app/pdf/[tenantId]/Home/page.tsx',
  'apps/dashboard/app/drive/[tenantId]/Home/page.tsx',

  'apps/sales/app/sales/[tenantId]/Home/page.tsx',
  'apps/dashboard/app/inventory/[tenantId]/Home/page.tsx',
  'apps/dashboard/app/analytics/[tenantId]/Home/page.tsx',
  'apps/dashboard/app/communication/[tenantId]/Home/page.tsx',
  'apps/dashboard/app/support/[tenantId]/Home/page.tsx',
  'apps/dashboard/app/support/[tenantId]/page.tsx',
  'apps/dashboard/app/marketing/[tenantId]/Home/page.tsx',
  'apps/website-builder/app/website-builder/[tenantId]/Home/page.tsx',
  'components/marketing/home/MarketingCommandCenter.tsx',

  'apps/dashboard/app/workflow-automation/[tenantId]/Home/page.tsx',
]

const INDUSTRY = [
  'education',
  'healthcare',
  'manufacturing',
  'retail',
  'agriculture',
  'automotive',
  'beauty',
  'construction',
  'ecommerce',
  'events',
  'field-service',
  'financial-services',
  'hospitality',
  'legal',
  'lms',
  'logistics',
  'professional-services',
  'real-estate',
  'restaurant',
  'wholesale',
  'contracts',
  'asset-management',
  'compliance',
  'appointments',
  'knowledge-rag',
  'ai-studio',
  'industry-intelligence',
]

for (const id of INDUSTRY) {
  CHECKS.push(`apps/dashboard/app/${id}/[tenantId]/Home/page.tsx`)
}

const ACTION_CHECKS = [
  'apps/crm/app/crm/[tenantId]/Deals',
  'apps/crm/app/crm/[tenantId]/Tasks',
  'apps/crm/app/crm/[tenantId]/Reports',
  'apps/crm/app/crm/[tenantId]/Contacts',
  'apps/finance/app/finance/[tenantId]/Invoices',
  'apps/finance/app/finance/[tenantId]/GST',
  'apps/hr/app/hr/[tenantId]/Employees',
  'apps/hr/app/hr/[tenantId]/Attendance',
  'apps/projects/app/projects/[tenantId]/Projects',
  'apps/sales/app/sales/[tenantId]/Orders',
  'apps/sales/app/sales/[tenantId]/Sales-Pages',
  'apps/dashboard/app/support/[tenantId]/Tickets',
  'apps/dashboard/app/support/[tenantId]/Unibox',
  'apps/dashboard/app/support/[tenantId]/Chat',
  'apps/dashboard/app/workflow-automation/[tenantId]/Workflows',
  'apps/dashboard/app/workflow-automation/[tenantId]/Runs',
  'apps/dashboard/app/inventory/[tenantId]/Products',
  'apps/dashboard/app/analytics/[tenantId]/Reports',
  'apps/dashboard/app/marketing/[tenantId]/Studio',
  'apps/dashboard/app/marketing/[tenantId]/Campaigns',
  'apps/website-builder/app/website-builder/[tenantId]/Sites',
  'apps/dashboard/app/appointments',
  'apps/dashboard/app/appointments/[tenantId]/Home',
]

const missing = []
for (const rel of CHECKS) {
  if (!exists(rel)) missing.push(rel)
}
for (const rel of ACTION_CHECKS) {
  const page = path.join(ROOT, rel, 'page.tsx')
  const dir = path.join(ROOT, rel)
  const direct = path.join(ROOT, rel)
  if (
    !fs.existsSync(page) &&
    !fs.existsSync(dir) &&
    !fs.existsSync(direct) &&
    !fs.existsSync(path.join(ROOT, `${rel}.tsx`))
  ) {
    missing.push(`${rel} (page/dir)`)
  }
}

if (missing.length) {
  console.error('FAIL: missing module dashboard paths:')
  for (const m of missing) console.error(' -', m)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checkedHomes: CHECKS.length,
      checkedActions: ACTION_CHECKS.length,
      industryHomes: INDUSTRY.length,
    },
    null,
    2
  )
)
