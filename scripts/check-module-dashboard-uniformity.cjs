/**
 * Uniform module-dashboard home auditor (static).
 * Audits known Home/page.tsx paths (same inventory as homes No-404 gate).
 * Requires ModuleDashboardShell / ComingSoon / ProductivityTool / CrmHomeDashboard / MarketingCommandCenter.
 * Fails on leftover UniversalModuleHero-only homes.
 * Flags fake demo metric patterns (hardcoded large demo numbers in stubs).
 *
 * Usage: node scripts/check-module-dashboard-uniformity.cjs
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

const CORE_HOMES = [
  'apps/crm/app/crm/[tenantId]/Home/page.tsx',
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
  'apps/dashboard/app/marketing/[tenantId]/Home/page.tsx',
  'apps/website-builder/app/website-builder/[tenantId]/Home/page.tsx',
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

const UNIFORM_MARKERS = [
  'ModuleDashboardShell',
  'ComingSoonModuleHome',
  'ProductivityToolHome',
  'CrmHomeDashboard',
  'MarketingCommandCenter',
]

const FAKE_PATTERNS = [
  /value:\s*'450'/,
  /value:\s*'1\.2K'/,
  /formatINRForDisplay\(2500000\)/,
  /Students',\s*value:\s*'450'/,
]

const homes = [
  ...CORE_HOMES,
  ...INDUSTRY.map((id) => `apps/dashboard/app/${id}/[tenantId]/Home/page.tsx`),
]

const legacyHero = []
const nonUniform = []
const fakeMetrics = []
const missing = []
let uniform = 0

for (const rel of homes) {
  const file = path.join(ROOT, rel)
  if (!fs.existsSync(file)) {
    missing.push(rel)
    continue
  }
  const src = fs.readFileSync(file, 'utf8')
  const hasUniform = UNIFORM_MARKERS.some((m) => src.includes(m))
  const hasHero = src.includes('UniversalModuleHero')

  if (hasUniform) {
    uniform++
  } else if (hasHero) {
    legacyHero.push(rel)
  } else {
    nonUniform.push(rel)
  }

  if (src.includes('ComingSoonModuleHome') || src.includes('UniversalModuleHero')) {
    for (const re of FAKE_PATTERNS) {
      if (re.test(src)) {
        fakeMetrics.push(rel)
        break
      }
    }
  }
}

const kitOk = [
  'components/modules/dashboard/ModuleDashboardShell.tsx',
  'components/modules/dashboard/ComingSoonModuleHome.tsx',
  'components/modules/dashboard/ProductivityToolHome.tsx',
  'docs/ai/module-dashboard-uniformity.md',
  'scripts/check-module-dashboard-homes.cjs',
].every((rel) => fs.existsSync(path.join(ROOT, rel)))

const report = {
  ok:
    kitOk &&
    missing.length === 0 &&
    legacyHero.length === 0 &&
    nonUniform.length === 0 &&
    fakeMetrics.length === 0,
  homesFound: homes.length - missing.length,
  homesExpected: homes.length,
  uniform,
  missing,
  legacyHeroOnly: legacyHero,
  nonUniform,
  fakeMetrics,
  kitOk,
}

console.log(JSON.stringify(report, null, 2))

if (!report.ok) {
  console.error('FAIL: module dashboard uniformity gate')
  process.exit(1)
}

console.log('PASS: module dashboard uniformity')
