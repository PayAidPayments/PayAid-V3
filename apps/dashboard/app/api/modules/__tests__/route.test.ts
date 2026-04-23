import { GET } from '@/apps/dashboard/app/api/modules/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    tenant: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/onboarding/industry-presets', () => ({
  getRecommendedModules: jest.fn(),
}))

jest.mock('@/lib/taxonomy/license-module-catalog', () => ({
  getCanonicalLicenseModules: jest.fn(),
}))

const auth = jest.requireMock('@/lib/middleware/auth') as {
  requireModuleAccess: jest.Mock
}
const prismaMock = jest.requireMock('@/lib/db/prisma').prisma as {
  tenant: { findUnique: jest.Mock }
}
const getRecommendedModulesMock = jest.requireMock('@/lib/onboarding/industry-presets')
  .getRecommendedModules as jest.Mock
const getCanonicalLicenseModulesMock = jest.requireMock('@/lib/taxonomy/license-module-catalog')
  .getCanonicalLicenseModules as jest.Mock

describe('GET /api/modules canonical contract gate', () => {
  const originalFlag = process.env.CANONICAL_MODULE_API_ONLY

  beforeEach(() => {
    jest.clearAllMocks()
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tenant-1' })
    prismaMock.tenant.findUnique.mockResolvedValue({
      onboardingData: { industries: ['retail'], goals: ['grow'], businessComplexity: 'single' },
      onboardingCompleted: true,
      licensedModules: ['crm', 'finance', 'ai-studio'],
    })
    getRecommendedModulesMock.mockReturnValue({
      baseModules: ['crm', 'finance'],
      industryPacks: ['support'],
      recommendedModules: ['ai-chat'],
    })
    getCanonicalLicenseModulesMock.mockReturnValue([
      { id: 'crm', name: 'CRM & Sales', description: 'desc', category: 'suite' },
      { id: 'finance', name: 'Finance', description: 'desc', category: 'suite' },
      { id: 'ai-studio', name: 'AI Workspace', description: 'desc', category: 'capability' },
    ])
  })

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.CANONICAL_MODULE_API_ONLY
      return
    }
    process.env.CANONICAL_MODULE_API_ONLY = originalFlag
  })

  it('includes compatibility and legacy fields when canonical-only flag is disabled', async () => {
    delete process.env.CANONICAL_MODULE_API_ONLY
    const res = await GET({} as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.canonical).toBeDefined()
    expect(body.compatibility).toEqual({ deprecated: true, mode: 'legacy-fields-included' })
    expect(body.recommended).toBeDefined()
    expect(body.base).toBeDefined()
    expect(body.industry).toEqual([])
  })

  it('returns canonical-only payload when canonical-only flag is enabled', async () => {
    process.env.CANONICAL_MODULE_API_ONLY = '1'
    const res = await GET({} as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.canonical).toBeDefined()
    expect(body.recommended).toBeUndefined()
    expect(body.base).toBeUndefined()
    expect(body.industry).toBeUndefined()
    expect(body.compatibility).toBeUndefined()
  })
})
