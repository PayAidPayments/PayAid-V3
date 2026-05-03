import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@prisma/client'

const MAX_PEERS = 100
export const CONTACT_360_LIST_CAP = 25
const FEED_SLICE = 10
const FEED_MERGED_CAP = 28

export type Contact360Account = {
  id: string
  name: string
  type: string | null
  industry: string | null
  website: string | null
  city: string | null
  parentAccountId: string | null
  parentAccount: { id: string; name: string } | null
} | null

export type Contact360Input = {
  id: string
  email: string | null
  phone: string | null
  gstin: string | null
  accountId: string | null
  company: string | null
  account: Contact360Account
}

function mergeActivityFeed(
  interactions: {
    id: string
    type: string
    subject: string | null
    createdAt: Date
    contactId: string
  }[],
  tasks: {
    id: string
    title: string
    status: string
    dueDate: Date | null
    updatedAt: Date
    contactId: string | null
  }[],
  appointments: {
    id: string
    contactName: string
    status: string
    appointmentDate: Date
    type: string | null
    contactId: string | null
  }[],
  emails: { id: string; subject: string; receivedAt: Date; contactId: string | null }[],
  whatsapps: { id: string; lastMessageAt: Date | null; status: string; contactId: string }[],
  scheduled: {
    id: string
    subject: string | null
    scheduledAt: Date
    status: string
    contactId: string
  }[],
  sms: {
    id: string
    status: string
    message: string
    createdAt: Date
    contactId: string | null
  }[]
) {
  type Row = {
    kind: string
    at: Date
    title: string
    subtitle?: string
  }
  const rows: Row[] = []
  for (const i of interactions) {
    rows.push({
      kind: 'interaction',
      at: i.createdAt,
      title: i.type,
      subtitle: i.subject || undefined,
    })
  }
  for (const t of tasks) {
    rows.push({
      kind: 'task',
      at: t.dueDate || t.updatedAt,
      title: t.title,
      subtitle: t.status,
    })
  }
  for (const a of appointments) {
    rows.push({
      kind: 'appointment',
      at: a.appointmentDate,
      title: a.type || 'Appointment',
      subtitle: `${a.contactName} · ${a.status}`,
    })
  }
  for (const e of emails) {
    rows.push({
      kind: 'email',
      at: e.receivedAt,
      title: e.subject || '(No subject)',
    })
  }
  for (const w of whatsapps) {
    rows.push({
      kind: 'whatsapp',
      at: w.lastMessageAt || new Date(0),
      title: 'WhatsApp',
      subtitle: w.status,
    })
  }
  for (const s of scheduled) {
    rows.push({
      kind: 'scheduled_email',
      at: s.scheduledAt,
      title: s.subject || 'Scheduled email',
      subtitle: s.status,
    })
  }
  for (const m of sms) {
    rows.push({
      kind: 'sms',
      at: m.createdAt,
      title: 'SMS',
      subtitle: `${m.status} · ${m.message?.slice(0, 80) || ''}`,
    })
  }
  rows.sort((a, b) => b.at.getTime() - a.at.getTime())
  return rows.slice(0, FEED_MERGED_CAP).map((r) => ({
    kind: r.kind,
    at: r.at.toISOString(),
    title: r.title,
    subtitle: r.subtitle,
  }))
}

async function duplicateSuggestions(
  tenantId: string,
  main: { id: string; email: string | null; phone: string | null; gstin: string | null }
) {
  const or: Prisma.ContactWhereInput[] = []
  if (main.email?.trim()) or.push({ email: main.email.trim() })
  if (main.phone?.trim()) or.push({ phone: main.phone.trim() })
  if (main.gstin?.trim()) or.push({ gstin: main.gstin.trim() })
  if (or.length === 0) return []
  return prisma.contact.findMany({
    where: {
      tenantId,
      id: { not: main.id },
      OR: or,
    },
    select: { id: true, name: true, email: true, phone: true, company: true },
    take: 8,
    // Contact model in current schema does not have updatedAt.
    orderBy: { createdAt: 'desc' },
  })
}

export async function buildContact360(tenantId: string, contact: Contact360Input) {
  let peerIds: string[] = []
  let scope: 'account' | 'company' | 'solo' = 'solo'
  let scopeLabel = ''

  if (contact.accountId) {
    const peers = await prisma.contact.findMany({
      where: { tenantId, accountId: contact.accountId },
      select: { id: true },
      take: MAX_PEERS,
    })
    peerIds = peers.map((p) => p.id)
    scope = 'account'
    scopeLabel = contact.account?.name?.trim() || contact.company?.trim() || 'Account'
  } else {
    const company = contact.company?.trim()
    if (company) {
      const peers = await prisma.contact.findMany({
        where: {
          tenantId,
          company: { equals: company, mode: 'insensitive' },
        },
        select: { id: true },
        take: MAX_PEERS,
      })
      peerIds = peers.map((p) => p.id)
      scope = 'company'
      scopeLabel = company
    } else {
      peerIds = [contact.id]
    }
  }

  if (peerIds.length === 0) peerIds = [contact.id]
  const relatedContactIds = peerIds.filter((cid) => cid !== contact.id)

  const contractOr: Prisma.ContractWhereInput[] = [{ contactId: { in: peerIds } }]
  if (contact.accountId) contractOr.push({ accountId: contact.accountId })

  const quoteWhere: Prisma.QuoteWhereInput = {
    tenantId,
    OR: [{ contactId: { in: peerIds } }, { deal: { contactId: { in: peerIds } } }],
  }

  const [
    relatedContacts,
    accountDeals,
    accountOrders,
    accountQuotes,
    proposals,
    contracts,
    invoices,
    creditNotes,
    debitNotes,
    projects,
    workOrders,
    formSubmissions,
    surveyResponses,
    nurtureEnrollments,
    loyaltyRows,
    realEstateAdvances,
    interactions,
    tasksFeed,
    appointments,
    emailMessages,
    whatsappConversations,
    scheduledEmails,
    smsRows,
    customerInsight,
    dupes,
  ] = await Promise.all([
    relatedContactIds.length === 0
      ? Promise.resolve([])
      : prisma.contact.findMany({
          where: { tenantId, id: { in: relatedContactIds } },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            stage: true,
            company: true,
          },
          orderBy: { name: 'asc' },
          take: CONTACT_360_LIST_CAP,
        }),
    prisma.deal.findMany({
      where: { tenantId, contactId: { in: peerIds } },
      orderBy: { updatedAt: 'desc' },
      take: CONTACT_360_LIST_CAP,
      select: {
        id: true,
        name: true,
        value: true,
        stage: true,
        probability: true,
        contactId: true,
        createdAt: true,
        wonReason: true,
        lostReason: true,
        competitor: true,
        contact: { select: { id: true, name: true } },
      },
    }),
    prisma.order.findMany({
      where: { tenantId, customerId: { in: peerIds } },
      orderBy: { createdAt: 'desc' },
      take: CONTACT_360_LIST_CAP,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        customerId: true,
        customer: { select: { id: true, name: true } },
      },
    }),
    prisma.quote.findMany({
      where: quoteWhere,
      orderBy: { updatedAt: 'desc' },
      take: CONTACT_360_LIST_CAP,
      select: {
        id: true,
        quoteNumber: true,
        status: true,
        total: true,
        updatedAt: true,
        contactId: true,
        dealId: true,
        contact: { select: { id: true, name: true } },
        deal: {
          select: {
            id: true,
            name: true,
            contactId: true,
            contact: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.proposal.findMany({
      where: { tenantId, contactId: { in: peerIds } },
      orderBy: { updatedAt: 'desc' },
      take: CONTACT_360_LIST_CAP,
      select: {
        id: true,
        proposalNumber: true,
        title: true,
        status: true,
        total: true,
        updatedAt: true,
        contactId: true,
        dealId: true,
      },
    }),
    prisma.contract.findMany({
      where: { tenantId, OR: contractOr },
      orderBy: { updatedAt: 'desc' },
      take: CONTACT_360_LIST_CAP,
      select: {
        id: true,
        contractNumber: true,
        title: true,
        status: true,
        value: true,
        endDate: true,
        renewalDate: true,
        contactId: true,
        accountId: true,
        updatedAt: true,
      },
    }),
    prisma.invoice.findMany({
      where: { tenantId, customerId: { in: peerIds } },
      orderBy: { createdAt: 'desc' },
      take: CONTACT_360_LIST_CAP,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        total: true,
        dueDate: true,
        paidAt: true,
        invoiceDate: true,
        customerId: true,
        customer: { select: { id: true, name: true } },
      },
    }),
    prisma.creditNote.findMany({
      where: { tenantId, customerId: { in: peerIds } },
      orderBy: { creditNoteDate: 'desc' },
      take: CONTACT_360_LIST_CAP,
      select: {
        id: true,
        creditNoteNumber: true,
        status: true,
        total: true,
        creditNoteDate: true,
        customerId: true,
      },
    }),
    prisma.debitNote.findMany({
      where: { tenantId, customerId: { in: peerIds } },
      orderBy: { debitNoteDate: 'desc' },
      take: CONTACT_360_LIST_CAP,
      select: {
        id: true,
        debitNoteNumber: true,
        status: true,
        total: true,
        debitNoteDate: true,
        customerId: true,
      },
    }),
    prisma.project.findMany({
      where: { tenantId, clientId: { in: peerIds } },
      orderBy: { updatedAt: 'desc' },
      take: CONTACT_360_LIST_CAP,
      select: {
        id: true,
        name: true,
        status: true,
        code: true,
        clientId: true,
        updatedAt: true,
      },
    }),
    prisma.workOrder.findMany({
      where: { tenantId, contactId: { in: peerIds } },
      orderBy: { scheduledDate: 'desc' },
      take: CONTACT_360_LIST_CAP,
      select: {
        id: true,
        workOrderNumber: true,
        status: true,
        serviceType: true,
        scheduledDate: true,
        contactId: true,
      },
    }),
    prisma.formSubmission.findMany({
      where: { tenantId, contactId: { in: peerIds } },
      orderBy: { createdAt: 'desc' },
      take: CONTACT_360_LIST_CAP,
      select: {
        id: true,
        status: true,
        createdAt: true,
        contactId: true,
        form: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.surveyResponse.findMany({
      where: { tenantId, contactId: { in: peerIds } },
      orderBy: { updatedAt: 'desc' },
      take: CONTACT_360_LIST_CAP,
      select: {
        id: true,
        status: true,
        npsScore: true,
        satisfactionScore: true,
        completedAt: true,
        contactId: true,
        survey: { select: { id: true, name: true } },
      },
    }),
    prisma.nurtureEnrollment.findMany({
      where: { tenantId, contactId: { in: peerIds } },
      orderBy: { enrolledAt: 'desc' },
      take: CONTACT_360_LIST_CAP,
      select: {
        id: true,
        status: true,
        enrolledAt: true,
        completedSteps: true,
        totalSteps: true,
        contactId: true,
        template: { select: { id: true, name: true } },
      },
    }),
    prisma.loyaltyPoints.findMany({
      where: { tenantId, customerId: { in: peerIds } },
      take: CONTACT_360_LIST_CAP,
      select: {
        id: true,
        currentPoints: true,
        tier: true,
        customerId: true,
        program: { select: { name: true } },
      },
    }),
    prisma.realEstateAdvance.findMany({
      where: { tenantId, customerId: { in: peerIds } },
      orderBy: { createdAt: 'desc' },
      take: CONTACT_360_LIST_CAP,
      select: {
        id: true,
        advanceAmount: true,
        paymentStatus: true,
        createdAt: true,
        customerId: true,
        property: { select: { propertyName: true } },
      },
    }),
    prisma.interaction.findMany({
      // Interaction rows are tenant-scoped through contactId; model has no tenantId column.
      where: { contactId: { in: peerIds } },
      orderBy: { createdAt: 'desc' },
      take: FEED_SLICE,
      select: {
        id: true,
        type: true,
        subject: true,
        createdAt: true,
        contactId: true,
      },
    }),
    prisma.task.findMany({
      where: { tenantId, contactId: { in: peerIds }, module: 'crm' },
      orderBy: { updatedAt: 'desc' },
      take: FEED_SLICE,
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        updatedAt: true,
        contactId: true,
      },
    }),
    prisma.appointment.findMany({
      where: { tenantId, contactId: { in: peerIds } },
      orderBy: { appointmentDate: 'desc' },
      take: FEED_SLICE,
      select: {
        id: true,
        contactName: true,
        status: true,
        appointmentDate: true,
        type: true,
        contactId: true,
      },
    }),
    prisma.emailMessage.findMany({
      where: { contactId: { in: peerIds } },
      orderBy: { receivedAt: 'desc' },
      take: FEED_SLICE,
      select: { id: true, subject: true, receivedAt: true, contactId: true },
    }),
    prisma.whatsappConversation.findMany({
      where: { contactId: { in: peerIds } },
      orderBy: { lastMessageAt: 'desc' },
      take: FEED_SLICE,
      select: { id: true, lastMessageAt: true, status: true, contactId: true },
    }),
    prisma.scheduledEmail.findMany({
      where: { tenantId, contactId: { in: peerIds } },
      orderBy: { scheduledAt: 'desc' },
      take: FEED_SLICE,
      select: {
        id: true,
        subject: true,
        scheduledAt: true,
        status: true,
        contactId: true,
      },
    }),
    prisma.sMSDeliveryReport.findMany({
      where: { tenantId, contactId: { in: peerIds } },
      orderBy: { createdAt: 'desc' },
      take: FEED_SLICE,
      select: {
        id: true,
        status: true,
        message: true,
        createdAt: true,
        contactId: true,
      },
    }),
    prisma.customerInsight.findUnique({
      where: {
        contactId_tenantId: { contactId: contact.id, tenantId },
      },
    }),
    duplicateSuggestions(tenantId, {
      id: contact.id,
      email: contact.email,
      phone: contact.phone,
      gstin: contact.gstin,
    }),
  ])

  const activityFeed = mergeActivityFeed(
    interactions,
    tasksFeed,
    appointments,
    emailMessages,
    whatsappConversations,
    scheduledEmails,
    smsRows
  )

  const accountRecord = contact.account
    ? {
        id: contact.account.id,
        name: contact.account.name,
        type: contact.account.type,
        industry: contact.account.industry,
        website: contact.account.website,
        city: contact.account.city,
        parentAccountId: contact.account.parentAccountId,
        parentAccount: contact.account.parentAccount,
      }
    : null

  return {
    scope,
    scopeLabel,
    /** All contact IDs in this 360 peer set (for Deals list deep-link). */
    peerContactIds: peerIds,
    accountRecord,
    relatedContacts,
    accountDeals,
    accountOrders,
    accountQuotes,
    proposals,
    contracts,
    invoices,
    creditNotes,
    debitNotes,
    projects,
    workOrders,
    formSubmissions,
    surveyResponses,
    nurtureEnrollments,
    loyaltyRows,
    realEstateAdvances,
    activityFeed,
    customerInsight,
    duplicateSuggestions: dupes,
  }
}
