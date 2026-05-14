import { describe, expect, it } from '@jest/globals'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const REQUIRED_LI_CLOSURE_WORKFLOW = '.github/workflows/lead-intelligence-m1-closure.yml' as const

const REQUIRED_LI_PAGES = [
  'apps/dashboard/app/lead-intelligence/[tenantId]/Home/page.tsx',
  'apps/dashboard/app/lead-intelligence/[tenantId]/search/page.tsx',
  'apps/dashboard/app/lead-intelligence/[tenantId]/companies/page.tsx',
  'apps/dashboard/app/lead-intelligence/[tenantId]/saved-searches/page.tsx',
  'apps/dashboard/app/lead-intelligence/[tenantId]/exports/page.tsx',
] as const

const REQUIRED_LI_API_ROUTES = [
  'apps/dashboard/app/api/lead-intelligence/health/route.ts',
  'apps/dashboard/app/api/lead-intelligence/discovery/companies/route.ts',
  'apps/dashboard/app/api/lead-intelligence/saved-searches/route.ts',
  'apps/dashboard/app/api/lead-intelligence/saved-searches/[id]/route.ts',
  'apps/dashboard/app/api/lead-intelligence/exports/route.ts',
] as const

describe('lead intelligence route no-404 contracts', () => {
  it('keeps required lead intelligence pages present', () => {
    const root = process.cwd()
    for (const rel of REQUIRED_LI_PAGES) {
      expect(existsSync(path.join(root, rel))).toBe(true)
    }
  })

  it('keeps required lead intelligence api routes present', () => {
    const root = process.cwd()
    for (const rel of REQUIRED_LI_API_ROUTES) {
      expect(existsSync(path.join(root, rel))).toBe(true)
    }
  })

  it('keeps Lead Intelligence dedicated CI closure workflow wired', () => {
    const root = process.cwd()
    const abs = path.join(root, REQUIRED_LI_CLOSURE_WORKFLOW)
    expect(existsSync(abs)).toBe(true)
    const yml = readFileSync(abs, 'utf8')
    expect(yml).toContain('npm run check:lead-intelligence-m1-closure')
    expect(yml).toContain('lead-intelligence-m1-closure:')
    expect(yml).toContain('apps/dashboard/app/api/lead-intelligence/**')
  })
})
