import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { assertTenantFeatureEnabled, isTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    featureToggle: {
      findFirst: jest.fn(),
    },
  },
}))

describe('tenant feature flags', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns true when no toggle is configured', async () => {
    const prisma = require('@/lib/db/prisma')
    prisma.prisma.featureToggle.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null)

    const enabled = await isTenantFeatureEnabled('tn_1', 'm0_ai_native_core')
    expect(enabled).toBe(true)
  })

  it('throws when tenant feature is disabled', async () => {
    const prisma = require('@/lib/db/prisma')
    prisma.prisma.featureToggle.findFirst.mockResolvedValueOnce({ isEnabled: false })

    await expect(assertTenantFeatureEnabled('tn_1', 'm0_ai_native_core')).rejects.toBeInstanceOf(
      TenantFeatureDisabledError
    )
  })
})
