import { POST } from '@/apps/dashboard/app/api/ai/analyze-industry/route'

jest.mock('@/lib/ai/groq', () => ({
  getGroqClient: jest.fn(),
}))

jest.mock('@/lib/ai/ollama', () => ({
  getOllamaClient: jest.fn(),
}))

jest.mock('@/lib/ai/huggingface', () => ({
  getHuggingFaceClient: jest.fn(),
}))

const getGroqClientMock = jest.requireMock('@/lib/ai/groq').getGroqClient as jest.Mock

function buildRequest(body: Record<string, unknown>) {
  return {
    json: async () => body,
  } as any
}

describe('POST /api/ai/analyze-industry canonical contract gate', () => {
  const originalFlag = process.env.CANONICAL_MODULE_API_ONLY

  beforeEach(() => {
    jest.clearAllMocks()
    getGroqClientMock.mockReturnValue({
      chat: jest.fn().mockResolvedValue({
        message: JSON.stringify({
          coreModules: ['crm', 'ai-chat'],
          industryFeatures: ['automation'],
          description: 'Industry recommendation',
          keyProcesses: ['lead-management'],
        }),
      }),
    })
  })

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.CANONICAL_MODULE_API_ONLY
      return
    }
    process.env.CANONICAL_MODULE_API_ONLY = originalFlag
  })

  it('includes legacy compatibility/coreModules when canonical-only mode is disabled', async () => {
    delete process.env.CANONICAL_MODULE_API_ONLY
    const res = await POST(buildRequest({ industryName: 'Retail' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.canonical.suites).toEqual(expect.arrayContaining(['crm', 'ai-studio']))
    expect(body.coreModules).toEqual(expect.arrayContaining(['crm', 'ai-studio']))
    expect(body.compatibility).toEqual(
      expect.objectContaining({
        deprecated: true,
      })
    )
  })

  it('returns canonical-only response when canonical-only mode is enabled', async () => {
    process.env.CANONICAL_MODULE_API_ONLY = '1'
    const res = await POST(buildRequest({ industryName: 'Retail' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.canonical.suites).toEqual(expect.arrayContaining(['crm', 'ai-studio']))
    expect(body.coreModules).toBeUndefined()
    expect(body.compatibility).toBeUndefined()
  })
})
