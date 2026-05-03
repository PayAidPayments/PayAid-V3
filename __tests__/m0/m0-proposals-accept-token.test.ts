import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as acceptProposal } from '@/apps/dashboard/app/api/proposals/[id]/accept/route'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    proposal: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    invoice: {
      create: jest.fn(),
    },
  },
}))

describe('proposal accept token guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects accept when token is missing', async () => {
    const prisma = require('@/lib/db/prisma')
    prisma.prisma.proposal.findUnique.mockResolvedValue({
      id: 'prop_1',
      tenantId: 'tn_1',
      status: 'sent',
      publicToken: 'pub_tok_1',
      lineItems: [],
      autoConvertToInvoice: false,
    })

    const req = new NextRequest('http://localhost/api/proposals/prop_1/accept', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ acceptedBy: 'Customer' }),
    })

    const res = await acceptProposal(req, { params: Promise.resolve({ id: 'prop_1' }) })
    expect(res.status).toBe(401)
  })

  it('accepts proposal when valid token is provided', async () => {
    const prisma = require('@/lib/db/prisma')
    prisma.prisma.proposal.findUnique.mockResolvedValue({
      id: 'prop_1',
      tenantId: 'tn_1',
      status: 'sent',
      publicToken: 'pub_tok_1',
      contactName: 'Customer',
      contactEmail: 'c@example.com',
      customerComments: null,
      autoConvertToInvoice: false,
      lineItems: [],
    })
    prisma.prisma.proposal.update.mockResolvedValue({ id: 'prop_1', status: 'accepted' })

    const req = new NextRequest('http://localhost/api/proposals/prop_1/accept?token=pub_tok_1', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ acceptedBy: 'Customer' }),
    })

    const res = await acceptProposal(req, { params: Promise.resolve({ id: 'prop_1' }) })
    expect(res.status).toBe(200)
  })
})
