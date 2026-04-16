import { POST } from '@/apps/dashboard/app/api/ai/chat/route'
import { recordSpecialistAuditEvent } from '@/lib/ai/specialists/audit'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  requireCanonicalAiGatewayAccess: jest.fn(),
  handleLicenseError: jest.fn(),
}))

jest.mock('@/lib/ai/specialists/audit', () => ({
  recordSpecialistAuditEvent: jest.fn(),
}))

jest.mock('@/lib/ai/ollama', () => ({
  getOllamaClient: jest.fn(),
}))

jest.mock('@/lib/ai/groq', () => ({
  getGroqClient: jest.fn(),
}))

jest.mock('@/lib/ai/huggingface', () => ({
  getHuggingFaceClient: jest.fn(),
}))

jest.mock('@/lib/ai/semantic-cache', () => ({
  semanticCache: {
    get: jest.fn(),
    set: jest.fn(),
  },
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {},
}))

jest.mock('@/lib/ai/context-analyzer', () => ({
  analyzePromptContext: jest.fn(),
  formatClarifyingQuestions: jest.fn(),
}))

jest.mock('@/lib/queue/bull', () => ({
  mediumPriorityQueue: {
    add: jest.fn(),
  },
}))

const auth = jest.requireMock('@/lib/middleware/auth') as {
  requireModuleAccess: jest.Mock
  requireCanonicalAiGatewayAccess: jest.Mock
}

const recordAuditMock = recordSpecialistAuditEvent as jest.Mock

function buildRequest(body: Record<string, unknown>) {
  return {
    json: async () => body,
  } as any
}

describe('POST /api/ai/chat specialist policy + audit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    auth.requireCanonicalAiGatewayAccess.mockResolvedValue({
      roles: ['rep'],
      modules: ['crm', 'marketing'],
      permissions: [],
    })
    auth.requireModuleAccess.mockResolvedValue({
      tenantId: 'tenant-1',
      userId: 'user-1',
      licensedModules: ['crm', 'marketing'],
      roles: ['rep'],
    })
    recordAuditMock.mockResolvedValue({ id: 'audit-1' })
  })

  it('returns 403 and logs blocked audit event when policy denies', async () => {
    const req = buildRequest({
      message: 'Please execute this now',
      context: {
        module: 'marketing',
        specialistId: 'marketing-strategist',
        actionLevel: 'restricted',
        sessionId: 'session-denied',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.code).toBe('SPECIALIST_POLICY_DENIED')
    expect(recordAuditMock).toHaveBeenCalledTimes(1)
    expect(recordAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({
          eventType: 'specialist.action.blocked',
          permissionResult: 'denied',
          specialistId: 'marketing-strategist',
          actionLevel: 'restricted',
        }),
      })
    )
  })

  it('logs permission + completion audit events for personal-query filter path', async () => {
    const req = buildRequest({
      message: 'Tell me about my girlfriend',
      context: {
        module: 'crm',
        specialistId: 'sales-copilot',
        actionLevel: 'read',
        sessionId: 'session-personal-filter',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.service).toBe('filtered')
    expect(recordAuditMock).toHaveBeenCalledTimes(2)
    expect(recordAuditMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        event: expect.objectContaining({
          eventType: 'specialist.permissions.checked',
          permissionResult: 'granted',
          specialistId: 'sales-copilot',
        }),
      })
    )
    expect(recordAuditMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        event: expect.objectContaining({
          eventType: 'specialist.response.completed',
          permissionResult: 'granted',
          reason: 'business-only filter',
        }),
      })
    )
  })

  it('returns 409 and logs blocked audit event when approval is missing for restricted mode', async () => {
    auth.requireCanonicalAiGatewayAccess.mockResolvedValueOnce({
      roles: ['admin'],
      modules: ['marketing'],
      permissions: [],
    })
    auth.requireModuleAccess.mockResolvedValueOnce({
      tenantId: 'tenant-1',
      userId: 'user-1',
      licensedModules: ['marketing'],
      roles: ['admin'],
    })

    const req = buildRequest({
      message: 'Publish this campaign now',
      context: {
        module: 'marketing',
        specialistId: 'campaign-builder',
        actionLevel: 'restricted',
        sessionId: 'session-approval-missing',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.code).toBe('SPECIALIST_APPROVAL_REQUIRED')
    expect(recordAuditMock).toHaveBeenCalledTimes(1)
    expect(recordAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({
          eventType: 'specialist.action.blocked',
          permissionResult: 'denied',
          specialistId: 'campaign-builder',
          actionLevel: 'restricted',
          reason: expect.stringContaining('Approval confirmation required'),
        }),
      })
    )
  })
})

