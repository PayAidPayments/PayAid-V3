import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/apps/dashboard/app/api/calls/webhook/route'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    aICall: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tenantTelephonySettings: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

describe('POST /api/calls/webhook (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const db = require('@/lib/db/prisma')
    db.prisma.tenantTelephonySettings.findFirst.mockResolvedValue({ tenantId: 'tn_m2' })
    db.prisma.tenantTelephonySettings.updateMany.mockResolvedValue({ count: 1 })
  })

  it('returns TwiML for in-progress inbound call', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.aICall.findUnique.mockResolvedValue(null)
    db.prisma.aICall.create.mockResolvedValue({ id: 'call_1' })

    const form = new URLSearchParams({
      CallSid: 'CA123',
      CallStatus: 'in-progress',
      From: '+911234567890',
      To: '+911112223334',
      Direction: 'inbound',
      AccountSid: 'AC123',
    })

    const req = new NextRequest('http://localhost/api/calls/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    const res = await POST(req)
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/xml')
    expect(body).toContain('<Response>')
    expect(body).toContain('<Gather')
  })

  it('returns success json when status field is missing', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.aICall.findUnique.mockResolvedValue(null)

    const form = new URLSearchParams({
      CallSid: 'CA124',
      From: '+911234567890',
      To: '+911112223334',
      Direction: 'inbound',
      AccountSid: 'AC124',
    })

    const req = new NextRequest('http://localhost/api/calls/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('updates existing call status and returns success json', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.aICall.findUnique.mockResolvedValue({
      id: 'call_existing',
      answeredAt: null,
      endedAt: null,
    })
    db.prisma.aICall.update.mockResolvedValue({ id: 'call_existing' })

    const form = new URLSearchParams({
      CallSid: 'CA125',
      CallStatus: 'completed',
      From: '+911234567890',
      To: '+911112223334',
      Direction: 'outbound-api',
      AccountSid: 'AC125',
    })

    const req = new NextRequest('http://localhost/api/calls/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(db.prisma.aICall.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'call_existing' },
      })
    )
  })

  it('creates call for completed status and returns success json', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.aICall.findUnique.mockResolvedValue(null)
    db.prisma.aICall.create.mockResolvedValue({ id: 'call_created' })

    const form = new URLSearchParams({
      CallSid: 'CA126',
      CallStatus: 'completed',
      From: '+911234567890',
      To: '+911112223334',
      Direction: 'outbound-api',
      AccountSid: 'AC126',
    })

    const req = new NextRequest('http://localhost/api/calls/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(db.prisma.aICall.create).toHaveBeenCalled()
  })

  it('returns TwiML for ringing inbound call', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.aICall.findUnique.mockResolvedValue(null)
    db.prisma.aICall.create.mockResolvedValue({ id: 'call_ring' })

    const form = new URLSearchParams({
      CallSid: 'CA127',
      CallStatus: 'ringing',
      From: '+911234567890',
      To: '+911112223334',
      Direction: 'inbound',
      AccountSid: 'AC127',
    })

    const req = new NextRequest('http://localhost/api/calls/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    const res = await POST(req)
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/xml')
    expect(body).toContain('<Response>')
    expect(body).toContain('<Gather')
  })

  it('returns success json for busy status', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.aICall.findUnique.mockResolvedValue(null)
    db.prisma.aICall.create.mockResolvedValue({ id: 'call_busy' })

    const form = new URLSearchParams({
      CallSid: 'CA128',
      CallStatus: 'busy',
      From: '+911234567890',
      To: '+911112223334',
      Direction: 'outbound-api',
      AccountSid: 'AC128',
    })

    const req = new NextRequest('http://localhost/api/calls/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns success json for failed status', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.aICall.findUnique.mockResolvedValue(null)
    db.prisma.aICall.create.mockResolvedValue({ id: 'call_failed' })

    const form = new URLSearchParams({
      CallSid: 'CA129',
      CallStatus: 'failed',
      From: '+911234567890',
      To: '+911112223334',
      Direction: 'outbound-api',
      AccountSid: 'AC129',
    })

    const req = new NextRequest('http://localhost/api/calls/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })
})
