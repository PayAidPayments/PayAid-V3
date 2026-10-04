import { afterAll, describe, expect, it } from '@jest/globals'
import {
  evaluateCustomerSpecialistEntitlement,
  loadCustomerSpecialistCatalog,
  resetCustomerSpecialistCatalogCache,
} from '@/lib/ai/customer-specialists'

describe('customer specialist entitlements', () => {
  const catalog = loadCustomerSpecialistCatalog()

  afterAll(() => {
    resetCustomerSpecialistCatalogCache()
  })

  it('loads the Phase 2 customer catalog', () => {
    expect(catalog.pack).toBe('customer')
    expect(catalog.agents.length).toBeGreaterThanOrEqual(12)
  })

  it('allows a licensed CRM member to draft with discovery coach', () => {
    const decision = evaluateCustomerSpecialistEntitlement({
      catalog,
      agentSlug: 'sales-discovery-coach',
      context: {
        tenantId: 'tenant-1',
        userId: 'user-1',
        roles: ['member'],
        licensedModules: ['crm'],
        requestedCapability: 'draft',
        draftType: 'discovery_call_plan',
      },
    })
    expect(decision.allowed).toBe(true)
    expect(decision.reasonCode).toBe('ALLOW')
    expect(decision.auditRequired).toBe(true)
    expect(decision.matchedModules).toContain('crm')
  })

  it('denies when tenant lacks required module', () => {
    const decision = evaluateCustomerSpecialistEntitlement({
      catalog,
      agentSlug: 'finance-bookkeeper',
      context: {
        tenantId: 'tenant-1',
        userId: 'user-1',
        roles: ['admin'],
        licensedModules: ['crm'],
        requestedCapability: 'draft',
      },
    })
    expect(decision.allowed).toBe(false)
    expect(decision.reasonCode).toBe('MODULE_NOT_LICENSED')
  })

  it('denies forbidden send capability', () => {
    const decision = evaluateCustomerSpecialistEntitlement({
      catalog,
      agentSlug: 'marketing-email-strategist',
      context: {
        tenantId: 'tenant-1',
        userId: 'user-1',
        roles: ['manager'],
        licensedModules: ['marketing'],
        requestedCapability: 'send',
      },
    })
    expect(decision.allowed).toBe(false)
    expect(decision.reasonCode).toBe('CAPABILITY_FORBIDDEN')
  })

  it('denies unknown agent slug', () => {
    const decision = evaluateCustomerSpecialistEntitlement({
      catalog,
      agentSlug: 'not-a-real-agent',
      context: {
        tenantId: 'tenant-1',
        userId: 'user-1',
        roles: ['owner'],
        licensedModules: ['crm'],
      },
    })
    expect(decision.allowed).toBe(false)
    expect(decision.reasonCode).toBe('AGENT_UNKNOWN')
  })

  it('denies when role is insufficient', () => {
    const decision = evaluateCustomerSpecialistEntitlement({
      catalog,
      agentSlug: 'finance-bookkeeper',
      context: {
        tenantId: 'tenant-1',
        userId: 'user-1',
        roles: ['member'],
        licensedModules: ['finance'],
        requestedCapability: 'draft',
      },
    })
    expect(decision.allowed).toBe(false)
    expect(decision.reasonCode).toBe('ROLE_DENIED')
  })
})
