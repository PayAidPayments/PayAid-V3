/**
 * Seed CRM + Marketing + Finance sample data for April 2026.
 *
 * Usage:
 *   npx tsx scripts/seed-april-2026-modules.ts <tenantId>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const tenantId = process.argv[2] || 'cmjptk2mw0000aocw31u48n64'
const APRIL_START = new Date('2026-04-01T00:00:00.000Z')
const APRIL_END = new Date('2026-04-30T23:59:59.999Z')

function randomAprilDate(): Date {
  const span = APRIL_END.getTime() - APRIL_START.getTime()
  return new Date(APRIL_START.getTime() + Math.random() * span)
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main() {
  console.log(`Seeding April 2026 sample data for tenant: ${tenantId}`)

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`)
  }

  const user = await prisma.user.findFirst({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true },
  })
  if (!user) {
    throw new Error(`No user found for tenant: ${tenantId}`)
  }

  let salesRep = await prisma.salesRep.findFirst({
    where: { tenantId, userId: user.id },
    select: { id: true },
  })
  if (!salesRep) {
    salesRep = await prisma.salesRep.create({
      data: {
        tenantId,
        userId: user.id,
        specialization: 'Demo Sales',
      },
      select: { id: true },
    })
  }

  const runTag = `APR26-${Date.now().toString(36).toUpperCase()}`

  // CRM: Contacts
  const contacts: Array<{ id: string; name: string; company: string | null }> = []
  for (let i = 1; i <= 30; i++) {
    const createdAt = randomAprilDate()
    const contact = await prisma.contact.create({
      data: {
        tenantId,
        assignedToId: salesRep.id,
        name: `April Demo Contact ${i}`,
        email: `april26-contact-${runTag}-${i}@demo.payaid.local`,
        phone: `+91-98${String(rand(10000000, 99999999))}`,
        company: `April Co ${i}`,
        source: ['Website', 'LinkedIn', 'Referral', 'Google Ads'][i % 4],
        stage: ['prospect', 'contact', 'customer'][i % 3],
        status: 'active',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        createdAt,
      },
      select: { id: true, name: true, company: true },
    })
    contacts.push(contact)
  }

  // CRM: Deals
  const dealStages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
  for (let i = 1; i <= 36; i++) {
    const contact = contacts[i % contacts.length]
    const createdAt = randomAprilDate()
    const stage = dealStages[i % dealStages.length]
    await prisma.deal.create({
      data: {
        tenantId,
        assignedToId: salesRep.id,
        contactId: contact.id,
        name: `April Deal ${i} - ${contact.company || contact.name}`,
        value: rand(25000, 850000),
        probability: stage === 'won' ? 100 : stage === 'lost' ? 0 : rand(20, 90),
        stage,
        createdAt,
        expectedCloseDate: stage === 'won' || stage === 'lost' ? null : randomAprilDate(),
        actualCloseDate: stage === 'won' || stage === 'lost' ? randomAprilDate() : null,
        lostReason: stage === 'lost' ? 'Demo competitor pricing' : null,
      },
    })
  }

  // Marketing: Campaigns
  const campaignTypes = ['email', 'whatsapp', 'sms', 'ads']
  for (let i = 1; i <= 20; i++) {
    const createdAt = randomAprilDate()
    const recipientCount = rand(80, 500)
    const sent = Math.floor(recipientCount * 0.95)
    const delivered = Math.floor(sent * 0.96)
    const opened = Math.floor(delivered * 0.32)
    const clicked = Math.floor(opened * 0.2)
    await prisma.campaign.create({
      data: {
        tenantId,
        name: `April 2026 Campaign ${i}`,
        type: campaignTypes[i % campaignTypes.length],
        subject: `April Promo ${i}`,
        content: `Demo campaign content ${i} for April 2026`,
        status: i % 5 === 0 ? 'scheduled' : 'sent',
        contactIds: contacts.slice(0, Math.min(contacts.length, 20)).map((c) => c.id),
        scheduledFor: i % 5 === 0 ? randomAprilDate() : null,
        sentAt: i % 5 === 0 ? null : createdAt,
        recipientCount,
        sent,
        delivered,
        opened,
        clicked,
        bounced: Math.floor(sent * 0.02),
        unsubscribed: Math.floor(sent * 0.01),
        createdAt,
      },
    })
  }

  // Finance: Orders + Invoices
  for (let i = 1; i <= 26; i++) {
    const createdAt = randomAprilDate()
    const subtotal = rand(15000, 250000)
    const tax = Math.round(subtotal * 0.18)
    const shipping = rand(150, 900)
    const total = subtotal + tax + shipping
    const customer = contacts[i % contacts.length]

    const order = await prisma.order.create({
      data: {
        tenantId,
        customerId: customer.id,
        orderNumber: `${runTag}-ORD-${String(i).padStart(4, '0')}`,
        status: ['pending', 'confirmed', 'processing', 'shipped', 'delivered'][i % 5],
        subtotal,
        tax,
        shipping,
        total,
        shippingAddress: `${rand(10, 999)} Demo Street`,
        shippingCity: 'Bengaluru',
        shippingPostal: '560001',
        shippingCountry: 'India',
        createdAt,
        paidAt: i % 3 === 0 ? randomAprilDate() : null,
        shippedAt: i % 4 === 0 ? randomAprilDate() : null,
        deliveredAt: i % 5 === 0 ? randomAprilDate() : null,
      },
      select: { orderNumber: true, customerId: true },
    })

    await prisma.invoice.create({
      data: {
        tenantId,
        customerId: order.customerId || undefined,
        invoiceNumber: `${runTag}-INV-${String(i).padStart(4, '0')}`,
        status: ['draft', 'sent', 'paid', 'overdue'][i % 4],
        subtotal,
        tax,
        total,
        gstRate: 18,
        gstAmount: tax,
        invoiceDate: createdAt,
        dueDate: new Date(createdAt.getTime() + rand(7, 30) * 24 * 60 * 60 * 1000),
        paidAt: i % 4 === 2 ? randomAprilDate() : null,
        orderNumber: order.orderNumber,
        customerName: customer.name,
        customerEmail: `billing-${runTag}-${i}@demo.payaid.local`,
        customerPhone: `+91-97${String(rand(10000000, 99999999))}`,
        customerCity: 'Bengaluru',
        customerState: 'Karnataka',
        customerPostalCode: '560001',
        currency: 'INR',
        createdAt,
      },
    })
  }

  // Verification counts for April 2026
  const whereApril = { gte: APRIL_START, lte: APRIL_END }
  const [contactCount, dealCount, campaignCount, orderCount, invoiceCount] = await Promise.all([
    prisma.contact.count({ where: { tenantId, createdAt: whereApril } }),
    prisma.deal.count({ where: { tenantId, createdAt: whereApril } }),
    prisma.campaign.count({ where: { tenantId, createdAt: whereApril } }),
    prisma.order.count({ where: { tenantId, createdAt: whereApril } }),
    prisma.invoice.count({ where: { tenantId, createdAt: whereApril } }),
  ])

  console.log('April 2026 data available now:')
  console.log(`  CRM     - Contacts: ${contactCount}, Deals: ${dealCount}`)
  console.log(`  Marketing - Campaigns: ${campaignCount}`)
  console.log(`  Finance - Orders: ${orderCount}, Invoices: ${invoiceCount}`)
  console.log(`Seed tag: ${runTag}`)
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

