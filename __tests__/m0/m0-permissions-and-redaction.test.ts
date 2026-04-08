import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { redactPII } from '@/lib/privacy/redaction'

jest.mock('@/lib/middleware/auth', () => ({
  authenticateRequest: jest.fn(),
}))

describe('M0 permissions and redaction baseline', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('allows admin role without explicit permission', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.authenticateRequest.mockResolvedValue({
      roles: ['admin'],
      permissions: [],
    })

    const request = {
      headers: new Headers(),
    } as any

    await expect(assertAnyPermission(request, ['crm:workflow:write'])).resolves.toBeUndefined()
  })

  it('denies user missing required permission', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.authenticateRequest.mockResolvedValue({
      roles: ['user'],
      permissions: ['crm:read'],
    })

    const request = {
      headers: new Headers(),
    } as any

    await expect(assertAnyPermission(request, ['crm:workflow:write'])).rejects.toBeInstanceOf(
      PermissionDeniedError
    )
  })

  it('redacts email/phone/gstin from nested objects', () => {
    const redacted = redactPII({
      customerEmail: 'a@acme.com',
      notes: 'Call +919876543210',
      metadata: {
        gstin: '27ABCDE1234F1Z5',
        raw: 'Reach out at b@acme.com',
      },
    })

    expect(redacted.customerEmail).toBe('[REDACTED]')
    expect(String(redacted.notes)).toContain('[REDACTED_PHONE]')
    expect((redacted as any).metadata.gstin).toBe('[REDACTED]')
    expect((redacted as any).metadata.raw).toContain('[REDACTED_EMAIL]')
  })
})
