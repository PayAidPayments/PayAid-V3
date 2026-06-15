/**
 * executeBolnaBridgeTool — ToolExecutor delegation, draft-first, entitlement.
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

const mockTenantFindUnique = jest.fn()
const mockVoiceAgentFindFirst = jest.fn()
const mockAuditLogCreate = jest.fn()
const mockVoiceAgentCallFindFirst = jest.fn()
const mockMetadataUpdate = jest.fn()
const mockMetadataCreate = jest.fn()

jest.mock('@payaid/db', () => ({
  prisma: {
    tenant: { findUnique: (...args: unknown[]) => mockTenantFindUnique(...args) },
    voiceAgent: { findFirst: (...args: unknown[]) => mockVoiceAgentFindFirst(...args) },
    auditLog: { create: (...args: unknown[]) => mockAuditLogCreate(...args) },
    voiceAgentCall: { findFirst: (...args: unknown[]) => mockVoiceAgentCallFindFirst(...args) },
    voiceAgentCallMetadata: {
      update: (...args: unknown[]) => mockMetadataUpdate(...args),
      create: (...args: unknown[]) => mockMetadataCreate(...args),
    },
  },
}))

import { executeBolnaBridgeTool } from '@/lib/voice-agent/runtime/bolna-tool-bridge'

const claims = {
  tenantId: 'tenant_1',
  agentId: 'agent_1',
  callSid: 'CA_test_bridge',
}

describe('executeBolnaBridgeTool', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTenantFindUnique.mockResolvedValue({
      licensedModules: ['ai-studio'],
      subscriptionTier: 'pro',
      status: 'active',
    })
    mockVoiceAgentFindFirst.mockResolvedValue({
      id: 'agent_1',
      functions: { tools: [] },
    })
    mockAuditLogCreate.mockResolvedValue({ id: 'audit_1' })
    mockVoiceAgentCallFindFirst.mockResolvedValue(null)
  })

  it('executes ping via ToolExecutor', async () => {
    const { result, draft } = await executeBolnaBridgeTool({
      claims,
      action: 'ping',
      args: { message: 'hello' },
    })
    expect(draft).toBeUndefined()
    expect(result.error).toBeUndefined()
    expect(result.result).toMatchObject({ echoed: 'hello', callSid: 'CA_test_bridge' })
    expect(mockAuditLogCreate).toHaveBeenCalled()
  })

  it('returns draft for payment tools without confirmed=true', async () => {
    const { draft, result } = await executeBolnaBridgeTool({
      claims,
      action: 'send_payment_link',
      args: { amount: 100 },
    })
    expect(draft).toBe(true)
    expect(result.result).toMatchObject({ draft: true, action: 'send_payment_link' })
    expect(mockAuditLogCreate).toHaveBeenCalled()
  })

  it('rejects unlicensed tenant', async () => {
    mockTenantFindUnique.mockResolvedValue({
      licensedModules: ['crm'],
      subscriptionTier: 'pro',
      status: 'active',
    })
    await expect(
      executeBolnaBridgeTool({ claims, action: 'ping', args: {} }),
    ).rejects.toThrow(/not licensed/)
  })
})
