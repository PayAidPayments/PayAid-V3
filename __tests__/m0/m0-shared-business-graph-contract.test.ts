import { describe, expect, it } from '@jest/globals'

import { BusinessEntityRefSchema, EntityIdSchema } from '@/modules/shared/business-graph'
import { DashboardWidgetSchema } from '@/modules/shared/analytics/types'
import { CreateContactSchema } from '@/modules/shared/crm/types'
import { CreateInvoiceSchema } from '@/modules/shared/finance/types'
import { CreateInventoryItemSchema, CreateStockTransferSchema } from '@/modules/shared/inventory/types'
import { CreateTaskSchema } from '@/modules/shared/productivity/types'
import {
  isActivationRequest,
  isCompanyDiscoveryRequest,
  isContactDiscoveryRequest,
  isLeadAccountEnrichPayload,
  isLeadAccountEnrichRequest,
  isLeadAccountResolveContactsPayload,
  isLeadActivationPayload,
  isLeadComplianceAuditSweepPayload,
  isLeadComplianceAuditSweepRequest,
  isLeadContactEnrichPayload,
  isLeadContactEnrichRequest,
  isLeadDiscoveryPayload,
  isLeadExportGeneratePayload,
  isLeadExportGenerateRequest,
  isLeadSegmentReEnrichPayload,
  isLeadSegmentReEnrichRequest,
  isLeadSegmentRefreshPayload,
  isLeadSegmentRefreshRequest,
  isLeadScoreComputePayload,
  isLeadScoreComputeRequest,
  isLeadStartSequencePayload,
  isLeadStartSequenceRequest,
} from '@/packages/leads-core/src/contract-guards'

describe('shared business graph contracts', () => {
  it('accepts both cuid and uuid entity ids', () => {
    const cuidResult = EntityIdSchema.safeParse('ckvpyj5w30000l08f8z6q0q1a')
    const uuidResult = EntityIdSchema.safeParse('550e8400-e29b-41d4-a716-446655440000')
    const invalidResult = EntityIdSchema.safeParse('not-an-entity-id')

    expect(cuidResult.success).toBe(true)
    expect(uuidResult.success).toBe(true)
    expect(invalidResult.success).toBe(false)
  })

  it('enforces canonical business entity references', () => {
    const ok = BusinessEntityRefSchema.safeParse({
      module: 'crm',
      entity: 'contact',
      id: 'ckvpyj5w30000l08f8z6q0q1a',
    })
    const bad = BusinessEntityRefSchema.safeParse({
      module: 'hr',
      entity: 'employee',
      id: 'ckvpyj5w30000l08f8z6q0q1a',
    })

    expect(ok.success).toBe(true)
    expect(bad.success).toBe(false)
  })

  it('applies shared entity-id contract in finance and productivity create schemas', () => {
    const finance = CreateInvoiceSchema.safeParse({
      organizationId: 'ckvpyj5w30000l08f8z6q0q1a',
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      invoiceDate: '2026-04-28T00:00:00.000Z',
      dueDate: '2026-05-28T00:00:00.000Z',
      lineItems: [{ description: 'Service', quantity: 1, unitPrice: 1000, taxRate: 18 }],
      discountINR: 0,
      paymentTerms: 'net30',
    })

    const productivity = CreateTaskSchema.safeParse({
      organizationId: 'ckvpyj5w30000l08f8z6q0q1a',
      title: 'Follow up',
      assignedTo: ['550e8400-e29b-41d4-a716-446655440000'],
      linkedTo: {
        module: 'finance',
        entity: 'invoice',
        id: 'ckvpyj5w30000l08f8z6q0q1a',
      },
    })

    expect(finance.success).toBe(true)
    expect(productivity.success).toBe(true)
  })

  it('applies shared entity-id contract in crm create schema', () => {
    const crm = CreateContactSchema.safeParse({
      organizationId: 'ckvpyj5w30000l08f8z6q0q1a',
      industryModule: 'saas',
      firstName: 'Asha',
      lastName: 'Rao',
      email: 'asha@example.com',
      phone: '+919999999999',
      contactType: 'lead',
    })
    expect(crm.success).toBe(true)
  })

  it('enforces business-graph module set in analytics widget datasource', () => {
    const ok = DashboardWidgetSchema.safeParse({
      id: 'ckvpyj5w30000l08f8z6q0q1a',
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      dashboardId: 'ckvpyj5w30000l08f8z6q0q1a',
      widgetType: 'chart',
      title: 'Revenue trend',
      dataSource: { module: 'inventory', metric: 'stock_turnover', dateRange: 'month' },
      position: { x: 0, y: 0 },
      size: { width: 6, height: 4 },
    })
    const bad = DashboardWidgetSchema.safeParse({
      id: 'ckvpyj5w30000l08f8z6q0q1a',
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      dashboardId: 'ckvpyj5w30000l08f8z6q0q1a',
      widgetType: 'chart',
      title: 'Revenue trend',
      dataSource: { module: 'hr', metric: 'headcount', dateRange: 'month' },
      position: { x: 0, y: 0 },
      size: { width: 6, height: 4 },
    })

    expect(ok.success).toBe(true)
    expect(bad.success).toBe(false)
  })

  it('validates lead activation cross-module payload shape', () => {
    const validPayload = {
      orgId: 'ckvpyj5w30000l08f8z6q0q1a',
      accountIds: ['550e8400-e29b-41d4-a716-446655440000'],
      destination: 'crm',
      options: { createTasks: true },
    }

    expect(
      isActivationRequest(validPayload)
    ).toBe(true)
    expect(isLeadActivationPayload(validPayload)).toBe(true)
    expect(
      isActivationRequest({
        orgId: '',
        accountIds: ['x'],
        destination: 'crm',
      })
    ).toBe(false)
    expect(
      isLeadActivationPayload({
        orgId: 'ckvpyj5w30000l08f8z6q0q1a',
        accountIds: ['550e8400-e29b-41d4-a716-446655440000'],
        destination: 'hr',
        options: {},
      })
    ).toBe(false)
  })

  it('applies shared contracts in inventory create schemas', () => {
    const inventoryItem = CreateInventoryItemSchema.safeParse({
      organizationId: 'ckvpyj5w30000l08f8z6q0q1a',
      sku: 'SKU-100',
      name: 'Widget',
      quantity: 5,
      reorderLevel: 2,
      relatedEntity: {
        module: 'crm',
        entity: 'deal',
        id: '550e8400-e29b-41d4-a716-446655440000',
      },
    })

    const stockTransfer = CreateStockTransferSchema.safeParse({
      organizationId: 'ckvpyj5w30000l08f8z6q0q1a',
      transferNumber: 'TR-001',
      fromLocationId: 'ckvpyj5w30000l08f8z6q0q1a',
      toLocationId: '550e8400-e29b-41d4-a716-446655440000',
      productId: 'ckvpyj5w30000l08f8z6q0q1a',
      quantity: 3,
      relatedEntity: {
        module: 'finance',
        entity: 'invoice',
        id: 'ckvpyj5w30000l08f8z6q0q1a',
      },
    })

    expect(inventoryItem.success).toBe(true)
    expect(stockTransfer.success).toBe(true)
  })

  it('validates lead discovery queue payload contract parity', () => {
    const validDiscovery = {
      orgId: 'ckvpyj5w30000l08f8z6q0q1a',
      briefId: '550e8400-e29b-41d4-a716-446655440000',
      segmentId: 'ckvpyj5w30000l08f8z6q0q1a',
      limit: 25,
      searchMode: 'seed',
    }
    expect(isLeadDiscoveryPayload(validDiscovery)).toBe(true)
    expect(isCompanyDiscoveryRequest(validDiscovery)).toBe(true)
    expect(
      isLeadDiscoveryPayload({
        orgId: 'ckvpyj5w30000l08f8z6q0q1a',
        briefId: '550e8400-e29b-41d4-a716-446655440000',
        segmentId: 'ckvpyj5w30000l08f8z6q0q1a',
        limit: 0,
        searchMode: 'seed',
      })
    ).toBe(false)
  })

  it('validates enrich/resolve/score queue payload guard parity', () => {
    const enrich = { orgId: 'ckvpyj5w30000l08f8z6q0q1a', accountId: '550e8400-e29b-41d4-a716-446655440000' }
    const resolveContacts = {
      orgId: 'ckvpyj5w30000l08f8z6q0q1a',
      accountId: '550e8400-e29b-41d4-a716-446655440000',
      personas: ['founder'],
      limit: 10,
    }
    const scoreCompute = { orgId: 'ckvpyj5w30000l08f8z6q0q1a', accountId: '550e8400-e29b-41d4-a716-446655440000' }

    expect(isLeadAccountEnrichPayload(enrich)).toBe(true)
    expect(isLeadAccountEnrichRequest(enrich)).toBe(true)

    expect(isLeadAccountResolveContactsPayload(resolveContacts)).toBe(true)
    expect(isContactDiscoveryRequest(resolveContacts)).toBe(true)

    expect(isLeadScoreComputePayload(scoreCompute)).toBe(true)
    expect(isLeadScoreComputeRequest(scoreCompute)).toBe(true)

    expect(isLeadAccountResolveContactsPayload({ ...resolveContacts, limit: 0 })).toBe(false)
    expect(isLeadScoreComputePayload({ orgId: '', accountId: 'x' })).toBe(false)
  })

  it('validates contact/segment queue payload guard parity', () => {
    const contactEnrich = { orgId: 'ckvpyj5w30000l08f8z6q0q1a', contactId: '550e8400-e29b-41d4-a716-446655440000' }
    const segmentRefresh = { orgId: 'ckvpyj5w30000l08f8z6q0q1a', segmentId: '550e8400-e29b-41d4-a716-446655440000' }
    const segmentReEnrich = { orgId: 'ckvpyj5w30000l08f8z6q0q1a', segmentId: '550e8400-e29b-41d4-a716-446655440000' }

    expect(isLeadContactEnrichPayload(contactEnrich)).toBe(true)
    expect(isLeadContactEnrichRequest(contactEnrich)).toBe(true)

    expect(isLeadSegmentRefreshPayload(segmentRefresh)).toBe(true)
    expect(isLeadSegmentRefreshRequest(segmentRefresh)).toBe(true)

    expect(isLeadSegmentReEnrichPayload(segmentReEnrich)).toBe(true)
    expect(isLeadSegmentReEnrichRequest(segmentReEnrich)).toBe(true)

    expect(isLeadContactEnrichPayload({ orgId: 'x', contactId: '' })).toBe(false)
    expect(isLeadSegmentRefreshPayload({ orgId: '', segmentId: 'x' })).toBe(false)
  })

  it('validates start-sequence/export/audit queue payload guard parity', () => {
    const startSequence = {
      orgId: 'ckvpyj5w30000l08f8z6q0q1a',
      sequenceId: '550e8400-e29b-41d4-a716-446655440000',
      contactIds: ['ckvpyj5w30000l08f8z6q0q1a'],
    }
    const exportGenerate = {
      orgId: 'ckvpyj5w30000l08f8z6q0q1a',
      format: 'csv' as const,
      segmentId: '550e8400-e29b-41d4-a716-446655440000',
    }
    const auditSweep = {
      orgId: 'ckvpyj5w30000l08f8z6q0q1a',
      scope: 'tenant' as const,
    }

    expect(isLeadStartSequencePayload(startSequence)).toBe(true)
    expect(isLeadStartSequenceRequest(startSequence)).toBe(true)

    expect(isLeadExportGeneratePayload(exportGenerate)).toBe(true)
    expect(isLeadExportGenerateRequest(exportGenerate)).toBe(true)

    expect(isLeadComplianceAuditSweepPayload(auditSweep)).toBe(true)
    expect(isLeadComplianceAuditSweepRequest(auditSweep)).toBe(true)

    expect(isLeadExportGeneratePayload({ orgId: 'x', format: 'pdf' })).toBe(false)
    expect(isLeadComplianceAuditSweepPayload({ orgId: '', scope: 'tenant' })).toBe(false)
  })
})
