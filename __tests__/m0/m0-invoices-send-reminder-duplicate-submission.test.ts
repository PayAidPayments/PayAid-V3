import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as sendReminder } from '@/apps/dashboard/app/api/invoices/[id]/send-reminder/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
}))

jest.mock('@/lib/automation/overdue-payment-reminders', () => ({
  sendOverdueReminder: jest.fn(),
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  findIdempotentRequest: jest.fn(),
  markIdempotentRequest: jest.fn(),
}))

describe('invoice send-reminder duplicate-submission protection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns deduplicated success for repeated key', async () => {
    const auth = require('@/lib/middleware/auth')
    const reminders = require('@/lib/automation/overdue-payment-reminders')
    const m0Service = require('@/lib/ai-native/m0-service')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({ id: 'idem_1' })

    const req = new NextRequest('http://localhost/api/invoices/inv_1/send-reminder', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_inv_reminder_1',
      },
      body: JSON.stringify({ channel: 'email' }),
    })

    const res = await sendReminder(req, { params: Promise.resolve({ id: 'inv_1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.deduplicated).toBe(true)
    expect(reminders.sendOverdueReminder).not.toHaveBeenCalled()
  })
})
