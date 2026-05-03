import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as getDeeplinkContext } from '@/apps/dashboard/app/api/marketing/email-campaigns/[campaignId]/deeplink-context/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((err: unknown) => err),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    emailTrackingEvent: { findFirst: jest.fn() },
    sMSDeliveryReport: { findFirst: jest.fn() },
    emailSendJob: { findFirst: jest.fn() },
  },
}))

describe('GET /api/marketing/email-campaigns/[campaignId]/deeplink-context', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when no ids are provided', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })

    const req = new NextRequest('http://localhost/api/marketing/email-campaigns/c1/deeplink-context', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await getDeeplinkContext(req, { params: Promise.resolve({ campaignId: 'c1' }) })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(String(body.error || '')).toMatch(/emailJobId/i)
  })

  it('returns tracking hit when event matches tenant and campaign', async () => {
    const auth = require('@/lib/middleware/auth')
    const { prisma } = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    prisma.emailTrackingEvent.findFirst.mockResolvedValue({
      eventType: 'open',
      occurredAt: new Date('2026-04-29T12:00:00.000Z'),
    })

    const req = new NextRequest(
      'http://localhost/api/marketing/email-campaigns/c1/deeplink-context?trackingEventId=ev_1',
      { headers: { authorization: 'Bearer t' } }
    )
    const res = await getDeeplinkContext(req, { params: Promise.resolve({ campaignId: 'c1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.tracking.found).toBe(true)
    expect(body.data.tracking.eventType).toBe('open')
    expect(prisma.emailTrackingEvent.findFirst).toHaveBeenCalledWith({
      where: { id: 'ev_1', tenantId: 'tn_1', campaignId: 'c1' },
      select: { eventType: true, occurredAt: true },
    })
  })

  it('returns tracking miss when no row matches', async () => {
    const auth = require('@/lib/middleware/auth')
    const { prisma } = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    prisma.emailTrackingEvent.findFirst.mockResolvedValue(null)

    const req = new NextRequest(
      'http://localhost/api/marketing/email-campaigns/c1/deeplink-context?trackingEventId=missing',
      { headers: { authorization: 'Bearer t' } }
    )
    const res = await getDeeplinkContext(req, { params: Promise.resolve({ campaignId: 'c1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.tracking.found).toBe(false)
  })

  it('returns sms hit and tracking when both params resolve', async () => {
    const auth = require('@/lib/middleware/auth')
    const { prisma } = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    prisma.emailTrackingEvent.findFirst.mockResolvedValue({
      eventType: 'click',
      occurredAt: new Date('2026-04-29T13:00:00.000Z'),
    })
    prisma.sMSDeliveryReport.findFirst.mockResolvedValue({
      status: 'DELIVERED',
      phoneNumber: '+15551234567',
    })

    const req = new NextRequest(
      'http://localhost/api/marketing/email-campaigns/c1/deeplink-context?trackingEventId=ev_2&smsReportId=sms_9',
      { headers: { authorization: 'Bearer t' } }
    )
    const res = await getDeeplinkContext(req, { params: Promise.resolve({ campaignId: 'c1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.tracking.found).toBe(true)
    expect(body.data.smsReport.found).toBe(true)
    expect(body.data.smsReport.phoneNumber).toBe('+15551234567')
  })

  it('returns sendJob hit when email job matches tenant and campaign', async () => {
    const auth = require('@/lib/middleware/auth')
    const { prisma } = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    prisma.emailSendJob.findFirst.mockResolvedValue({
      status: 'sent',
      subject: 'Hello',
    })

    const req = new NextRequest(
      'http://localhost/api/marketing/email-campaigns/c1/deeplink-context?emailJobId=job_1',
      { headers: { authorization: 'Bearer t' } }
    )
    const res = await getDeeplinkContext(req, { params: Promise.resolve({ campaignId: 'c1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.sendJob.found).toBe(true)
    expect(body.data.sendJob.status).toBe('sent')
    expect(prisma.emailSendJob.findFirst).toHaveBeenCalledWith({
      where: { id: 'job_1', tenantId: 'tn_1', campaignId: 'c1' },
      select: { status: true, subject: true },
    })
  })

  it('returns sendJob miss when no job matches', async () => {
    const auth = require('@/lib/middleware/auth')
    const { prisma } = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    prisma.emailSendJob.findFirst.mockResolvedValue(null)

    const req = new NextRequest(
      'http://localhost/api/marketing/email-campaigns/c1/deeplink-context?emailJobId=nope',
      { headers: { authorization: 'Bearer t' } }
    )
    const res = await getDeeplinkContext(req, { params: Promise.resolve({ campaignId: 'c1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.sendJob.found).toBe(false)
  })

  it('returns all three arms when tracking, sms, and email job params are sent together', async () => {
    const auth = require('@/lib/middleware/auth')
    const { prisma } = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    prisma.emailTrackingEvent.findFirst.mockResolvedValue({
      eventType: 'open',
      occurredAt: new Date('2026-04-29T10:00:00.000Z'),
    })
    prisma.sMSDeliveryReport.findFirst.mockResolvedValue({
      status: 'SENT',
      phoneNumber: '+1999',
    })
    prisma.emailSendJob.findFirst.mockResolvedValue({
      status: 'failed',
      subject: 'Triple',
    })

    const req = new NextRequest(
      'http://localhost/api/marketing/email-campaigns/camp_z/deeplink-context?trackingEventId=tr_1&smsReportId=sms_1&emailJobId=job_1',
      { headers: { authorization: 'Bearer t' } }
    )
    const res = await getDeeplinkContext(req, { params: Promise.resolve({ campaignId: 'camp_z' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.tracking.found).toBe(true)
    expect(body.data.smsReport.found).toBe(true)
    expect(body.data.sendJob.found).toBe(true)
    expect(body.data.sendJob.subject).toBe('Triple')
    expect(prisma.emailTrackingEvent.findFirst).toHaveBeenCalledWith({
      where: { id: 'tr_1', tenantId: 'tn_1', campaignId: 'camp_z' },
      select: { eventType: true, occurredAt: true },
    })
    expect(prisma.sMSDeliveryReport.findFirst).toHaveBeenCalledWith({
      where: { id: 'sms_1', tenantId: 'tn_1', campaignId: 'camp_z' },
      select: { status: true, phoneNumber: true },
    })
    expect(prisma.emailSendJob.findFirst).toHaveBeenCalledWith({
      where: { id: 'job_1', tenantId: 'tn_1', campaignId: 'camp_z' },
      select: { status: true, subject: true },
    })
  })
})
