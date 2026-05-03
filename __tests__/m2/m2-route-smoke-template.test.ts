import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

/**
 * Template for M2 route smoke tests.
 *
 * How to use:
 * - Replace the import below with the actual handler you want to test.
 * - Replace the mocked service module with the real one used by the handler.
 * - Keep assertions minimal (status + a couple of fields).
 */

// Example: import { GET } from '@/apps/dashboard/app/api/v1/marketplace/apps/route'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const GET = undefined as unknown as (req: NextRequest) => Promise<Response>

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((e: unknown) => e),
}))

jest.mock('@/lib/feature-flags/tenant-feature', () => ({
  assertTenantFeatureEnabled: jest.fn().mockResolvedValue(undefined),
  TenantFeatureDisabledError: class TenantFeatureDisabledError extends Error {
    constructor(public featureName: string) {
      super(`Feature "${featureName}" is disabled`)
      this.name = 'TenantFeatureDisabledError'
    }
  },
}))

jest.mock('@/lib/middleware/permissions', () => ({
  assertAnyPermission: jest.fn().mockResolvedValue(undefined),
  PermissionDeniedError: class PermissionDeniedError extends Error {},
}))

// Example: jest.mock('@/lib/m2/marketplace-service', () => ({ listApps: jest.fn() }))

describe('M2 route smoke template', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.skip('replace this with a real route smoke test', async () => {
    // Example:
    // const auth = require('@/lib/middleware/auth')
    // auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    //
    // const req = new NextRequest('http://localhost/api/v1/marketplace/apps', {
    //   headers: { authorization: 'Bearer t' },
    // })
    // const res = await GET(req)
    // const body = await res.json()
    // expect(res.status).toBe(200)
    // expect(body.schema_version).toBe('1.0')

    expect(typeof GET).toBe('function')
  })
})

