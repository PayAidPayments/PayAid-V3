import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/apps/dashboard/app/api/voice/demo/route'

jest.mock('@/lib/middleware/auth', () => ({
  authenticateRequest: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    voiceAgent: { findFirst: jest.fn() },
    voiceAgentCall: { create: jest.fn() },
  },
}))

jest.mock('@/lib/ai/groq', () => ({
  getGroqClient: jest.fn(),
}))

jest.mock('@/lib/voice-agent/llm', () => ({
  isGroqConfigured: jest.fn(),
}))

jest.mock('@/lib/voice-agent/knowledge-base', () => ({
  searchKnowledgeBase: jest.fn(),
}))

jest.mock('@/lib/voice-agent/tts', () => ({
  synthesizeSpeech: jest.fn(),
}))

jest.mock('@/lib/voice-agent/sarvam', () => ({
  isSarvamConfigured: jest.fn(),
  sarvamChat: jest.fn(),
  sarvamTts: jest.fn(),
}))

describe('POST /api/voice/demo (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.authenticateRequest.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/voice/demo', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ agentId: 'a_1', transcript: 'hello' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 for validation failure', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_m2', sub: 'usr_1' })

    const req = new NextRequest('http://localhost/api/voice/demo', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation failed')
  })
})
