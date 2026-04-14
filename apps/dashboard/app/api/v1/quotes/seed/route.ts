import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'

type DemoLineItem = {
  productName: string
  description: string
  quantity: number
  unitPrice: number
  discountRate: number
}

const DEMO_QUOTES_TARGET = 3

const DEMO_SCENARIOS: Array<{
  titleSuffix: string
  status: 'draft' | 'sent' | 'accepted'
  notes: string
  items: DemoLineItem[]
}> = [
  {
    titleSuffix: 'Starter Launch Package',
    status: 'draft',
    notes: 'Demo quote: first draft for internal review. Edit quantities, discount, and terms before sharing with customer.',
    items: [
      { productName: 'Implementation Workshop', description: 'Kickoff discovery + setup', quantity: 1, unitPrice: 25000, discountRate: 0 },
      { productName: 'User Onboarding', description: 'Training for 10 users', quantity: 1, unitPrice: 18000, discountRate: 0.05 },
      { productName: 'Priority Support', description: '90-day onboarding support', quantity: 1, unitPrice: 12000, discountRate: 0 },
    ],
  },
  {
    titleSuffix: 'Growth Plan - Sales Team',
    status: 'sent',
    notes: 'Demo quote: already sent to customer. Use this to explain quote lifecycle and follow-up process.',
    items: [
      { productName: 'Sales Automation License', description: '15 seats for one quarter', quantity: 15, unitPrice: 3200, discountRate: 0.08 },
      { productName: 'Pipeline Setup', description: 'Custom stages + dashboards', quantity: 1, unitPrice: 22000, discountRate: 0.1 },
      { productName: 'WhatsApp Campaign Credits', description: 'Promotional campaign messages', quantity: 1, unitPrice: 15000, discountRate: 0 },
    ],
  },
  {
    titleSuffix: 'Enterprise Annual Bundle',
    status: 'accepted',
    notes: 'Demo quote: approved example. Use this record to demonstrate approval trail and invoice conversion.',
    items: [
      { productName: 'Enterprise License', description: 'Annual plan (50 users)', quantity: 50, unitPrice: 6500, discountRate: 0.12 },
      { productName: 'Advanced Analytics Add-on', description: 'Forecast + AI insights pack', quantity: 1, unitPrice: 85000, discountRate: 0.05 },
      { productName: 'Dedicated Success Manager', description: 'Named account support', quantity: 12, unitPrice: 9000, discountRate: 0 },
    ],
  },
]

function totals(items: DemoLineItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const discount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice * item.discountRate, 0)
  const taxable = subtotal - discount
  const tax = taxable * 0.18
  const total = taxable + tax
  return { subtotal, discount, tax, total }
}

function makeQuoteNumber(seedIndex: number) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `Q-${date}-DEMO${seedIndex + 1}${random}`
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_cpq')

    const existingQuoteCount = await prisma.quote.count({ where: { tenantId } })
    const needed = Math.max(0, DEMO_QUOTES_TARGET - existingQuoteCount)

    if (needed === 0) {
      return NextResponse.json({
        success: true,
        created: 0,
        message: 'CPQ already has quote data for this tenant.',
      })
    }

    const availableDeals = await prisma.deal.findMany({
      where: { tenantId, quote: null },
      include: {
        contact: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: needed,
    })

    const selectedDeals = [...availableDeals]

    // Create lightweight demo deals only if there are no reusable deals left.
    if (selectedDeals.length < needed) {
      const missing = needed - selectedDeals.length
      for (let i = 0; i < missing; i += 1) {
        const scenario = DEMO_SCENARIOS[(selectedDeals.length + i) % DEMO_SCENARIOS.length]
        const demoDeal = await prisma.deal.create({
          data: {
            tenantId,
            name: `Demo Deal - ${scenario.titleSuffix}`,
            value: 50000 + i * 35000,
            stage: 'proposal',
            probability: 65,
            expectedCloseDate: new Date(Date.now() + (i + 7) * 24 * 60 * 60 * 1000),
            contactName: `Demo Buyer ${i + 1}`,
            contactEmail: `demo-buyer-${i + 1}@example.com`,
          },
          include: {
            contact: { select: { id: true, name: true, email: true } },
          },
        })
        selectedDeals.push(demoDeal)
      }
    }

    let created = 0
    for (let i = 0; i < selectedDeals.length; i += 1) {
      const deal = selectedDeals[i]
      const scenario = DEMO_SCENARIOS[i % DEMO_SCENARIOS.length]
      const calc = totals(scenario.items)

      const quote = await prisma.quote.create({
        data: {
          tenantId,
          dealId: deal.id,
          contactId: deal.contactId ?? deal.contact?.id ?? null,
          quoteNumber: makeQuoteNumber(i),
          status: scenario.status,
          subtotal: calc.subtotal,
          discount: calc.discount,
          tax: calc.tax,
          total: calc.total,
          validUntil: new Date(Date.now() + (21 + i * 7) * 24 * 60 * 60 * 1000),
          notes: scenario.notes,
          lineItems: {
            create: scenario.items.map((item) => {
              const base = item.quantity * item.unitPrice
              const lineDiscount = base * item.discountRate
              const lineTotal = (base - lineDiscount) * 1.18
              return {
                productName: item.productName,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: lineDiscount,
                total: lineTotal,
              }
            }),
          },
        },
        select: { id: true, status: true },
      })

      if (quote.status === 'accepted') {
        await prisma.quoteApproval.create({
          data: {
            quoteId: quote.id,
            approverId: userId,
            approverName: 'Demo Approver',
            approverEmail: 'approver@example.com',
            approvalOrder: 1,
            status: 'APPROVED',
            comments: 'Approved for demo walkthrough.',
            approvedAt: new Date(),
          },
        })
      }

      created += 1
    }

    return NextResponse.json({
      success: true,
      created,
      message: created > 0
        ? `Added ${created} demo quote${created > 1 ? 's' : ''} without modifying existing data.`
        : 'No demo quotes were added.',
    })
  } catch (e) {
    if (e instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: e.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const err = handleLicenseError(e)
    if (err) return err
    console.error('Seed demo CPQ quotes error:', e)
    return NextResponse.json({ error: 'Failed to seed demo CPQ quotes' }, { status: 500 })
  }
}
