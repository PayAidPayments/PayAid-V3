import { GET } from '@/apps/dashboard/app/api/industries/[industry]/modules/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
}))

jest.mock('@/lib/industries/module-config', () => ({
  getRecommendedModulesForIndustry: jest.fn(),
  autoConfigureIndustryModules: jest.fn(),
}))

const auth = jest.requireMock('@/lib/middleware/auth') as {
  requireModuleAccess: jest.Mock
}
const getRecommendedModulesForIndustryMock = jest.requireMock('@/lib/industries/module-config')
  .getRecommendedModulesForIndustry as jest.Mock

describe('GET /api/industries/[industry]/modules canonical contract gate', () => {
  const originalFlag = process.env.CANONICAL_MODULE_API_ONLY

  beforeEach(() => {
    jest.clearAllMocks()
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tenant-1' })
    getRecommendedModulesForIndustryMock.mockReturnValue({
      canonical: {
        suites: ['crm', 'finance'],
        capabilities: ['ai-studio'],
        optionalSuites: ['marketing'],
      },
      suites: ['crm', 'finance'],
      capabilities: ['ai-studio'],
      optionalSuites: ['marketing'],
      compatibility: {
        deprecated: true,
        coreModules: ['crm', 'finance'],
        industryPacks: ['retail'],
        optionalModules: ['marketing'],
      },
      coreModules: ['crm', 'finance'],
      industryPacks: ['retail'],
      optionalModules: ['marketing'],
    })
  })

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.CANONICAL_MODULE_API_ONLY
      return
    }
    process.env.CANONICAL_MODULE_API_ONLY = originalFlag
  })

  it('includes legacy aliases when canonical-only mode is disabled', async () => {
    delete process.env.CANONICAL_MODULE_API_ONLY
    const res = await GET({} as any, { params: Promise.resolve({ industry: 'retail' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.canonical).toBeDefined()
    expect(body.coreModules).toEqual(['crm', 'finance'])
    expect(body.industryPacks).toEqual(['retail'])
    expect(body.optionalModules).toEqual(['marketing'])
    expect(body.compatibility).toBeDefined()
  })

  it('returns canonical-only fields when canonical-only mode is enabled', async () => {
    process.env.CANONICAL_MODULE_API_ONLY = '1'
    const res = await GET({} as any, { params: Promise.resolve({ industry: 'retail' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.canonical).toBeDefined()
    expect(body.suites).toEqual(['crm', 'finance'])
    expect(body.capabilities).toEqual(['ai-studio'])
    expect(body.optionalSuites).toEqual(['marketing'])
    expect(body.coreModules).toBeUndefined()
    expect(body.industryPacks).toBeUndefined()
    expect(body.optionalModules).toBeUndefined()
    expect(body.compatibility).toBeUndefined()
  })
})
