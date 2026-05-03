import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/apps/dashboard/app/api/voice/ping/route'

jest.mock('@/lib/middleware/auth', () => ({
  authenticateRequest: jest.fn(),
}))

jest.mock('@/lib/ai/groq', () => ({
  getGroqClient: jest.fn(),
}))

jest.mock('@/lib/voice-agent/llm', () => ({
  isGroqConfigured: jest.fn(),
}))

describe('POST /api/voice/ping (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.authenticateRequest.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/voice/ping', {
      method: 'POST',
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.ok).toBe(false)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns ok:false when Groq is not configured', async () => {
    const auth = require('@/lib/middleware/auth')
    const llm = require('@/lib/voice-agent/llm')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_m2', sub: 'usr_1' })
    llm.isGroqConfigured.mockReturnValue(false)

    const req = new NextRequest('http://localhost/api/voice/ping', {
      method: 'POST',
      headers: { authorization: 'Bearer t' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(false)
  })

  it('returns ok:true when Groq ping succeeds', async () => {
    const auth = require('@/lib/middleware/auth')
    const llm = require('@/lib/voice-agent/llm')
    const groqLib = require('@/lib/ai/groq')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_m2', sub: 'usr_1' })
    llm.isGroqConfigured.mockReturnValue(true)
    groqLib.getGroqClient.mockReturnValue({
      chat: jest.fn().mockResolvedValue({ message: 'OK' }),
    })

    const req = new NextRequest('http://localhost/api/voice/ping', {
      method: 'POST',
      headers: { authorization: 'Bearer t' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
  })
})
