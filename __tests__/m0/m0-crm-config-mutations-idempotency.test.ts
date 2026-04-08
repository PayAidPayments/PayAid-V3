import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as applyTemplate } from '@/apps/dashboard/app/api/crm/templates/route'
import { POST as createWhatsappTemplate } from '@/apps/dashboard/app/api/crm/whatsapp-templates/route'
import { POST as upsertFieldLayout } from '@/apps/dashboard/app/api/crm/field-layouts/route'
import { POST as saveCustomPipeline } from '@/apps/dashboard/app/api/crm/pipelines/custom/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
}))

jest.mock('@/lib/middleware/license', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  findIdempotentRequest: jest.fn(),
  markIdempotentRequest: jest.fn(),
}))

jest.mock('@/lib/crm/template-migration', () => ({
  applyTemplate: jest.fn(),
  previewTemplate: jest.fn(),
}))

jest.mock('@/lib/crm/industry-templates', () => ({
  getAllTemplates: jest.fn(),
  getTemplateById: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    crmWhatsappTemplate: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    fieldLayout: {
      upsert: jest.fn(),
    },
    customReport: {
      upsert: jest.fn(),
    },
  },
}))

describe('CRM config mutation idempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deduplicates template apply with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    const migration = require('@/lib/crm/template-migration')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_template_apply_1',
      afterSnapshot: { applied: true },
    })

    const req = new NextRequest('http://localhost/api/crm/templates', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_template_apply_1',
      },
      body: JSON.stringify({
        templateId: 'tpl_real_estate',
        preview: false,
      }),
    })

    const res = await applyTemplate(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(migration.applyTemplate).not.toHaveBeenCalled()
  })

  it('deduplicates whatsapp template create with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_whatsapp_template_1',
      afterSnapshot: { template_id: 'wa_tpl_1' },
    })

    const req = new NextRequest('http://localhost/api/crm/whatsapp-templates', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_whatsapp_template_1',
      },
      body: JSON.stringify({
        name: 'Reminder',
        category: 'utility',
        body: 'Hi there',
      }),
    })

    const res = await createWhatsappTemplate(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.crmWhatsappTemplate.create).not.toHaveBeenCalled()
  })

  it('deduplicates field layout upsert with repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    prisma.prisma.user.findUnique.mockResolvedValue({ role: 'admin' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_field_layout_1',
      afterSnapshot: { upserted: true },
    })

    const req = new NextRequest('http://localhost/api/crm/field-layouts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_field_layout_1',
      },
      body: JSON.stringify({
        module: 'crm',
        entityType: 'lead',
        viewType: 'CREATE',
        layoutJson: { sections: [] },
      }),
    })

    const res = await upsertFieldLayout(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.fieldLayout.upsert).not.toHaveBeenCalled()
  })

  it('deduplicates custom pipeline save with repeated idempotency key', async () => {
    const license = require('@/lib/middleware/license')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')

    license.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_custom_pipeline_1',
      afterSnapshot: { saved: true },
    })

    const req = new NextRequest('http://localhost/api/crm/pipelines/custom', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_custom_pipeline_1',
      },
      body: JSON.stringify({
        stages: [{ id: 'lead', name: 'Lead', order: 0, probability: 10 }],
      }),
    })

    const res = await saveCustomPipeline(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.customReport.upsert).not.toHaveBeenCalled()
  })
})
