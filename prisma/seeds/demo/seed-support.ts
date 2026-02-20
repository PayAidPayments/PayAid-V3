/**
 * Support Module Seeder for Demo Business
 * Seeds: Support Tickets, Ticket Replies
 * Date Range: March 2025 - February 2026
 */

import type { PrismaClient } from '@prisma/client'
import { DateRange, DEMO_DATE_RANGE, randomDateInRange, distributeAcrossMonths, getMonthsInRange } from './date-utils'
import { requirePrismaClient } from './prisma-utils'

export interface SupportSeedResult {
  tickets: number
  replies: number
}

export async function seedSupportModule(
  tenantId: string,
  contacts: any[],
  userId: string,
  range: DateRange = DEMO_DATE_RANGE,
  prismaClient: PrismaClient
): Promise<SupportSeedResult> {
  const prisma = requirePrismaClient(prismaClient)
  console.log('🎫 Seeding Support Module...')

  // Support models may not exist in this schema; skip safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyPrisma = prisma as any
  if (!anyPrisma.supportTicket || !anyPrisma.supportReply) {
    console.log('  ⚠ Support models not available in this schema, skipping Support seeding')
    return { tickets: 0, replies: 0 }
  }

  // 1. SUPPORT TICKETS - 300 tickets distributed across ALL 12 months (Mar 2025 - Feb 2026)
  // CRITICAL: Ensure data spans entire range, not clustered in Jan/Feb
  const ticketStatuses = ['open', 'pending', 'in_progress', 'resolved', 'closed']
  const ticketPriorities = ['low', 'medium', 'high', 'urgent']
  const ticketCategories = ['technical', 'billing', 'feature_request', 'bug', 'general']
  const months = getMonthsInRange(range)
  const ticketsPerMonth = Math.floor(300 / months.length) // ~25 tickets per month

  const ticketData: Array<{
    tenantId: string
    contactId: string
    subject: string
    description: string
    status: string
    priority: string
    category: string
    assignedToId: string
    createdAt: Date
    resolvedAt: Date | null
    updatedAt: Date
  }> = []
  
  let ticketIndex = 0
  for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
    const month = months[monthIdx]
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)
    const ticketsThisMonth = monthIdx === months.length - 1 
      ? 300 - ticketIndex // Last month gets remaining tickets
      : ticketsPerMonth
    
    for (let i = 0; i < ticketsThisMonth && ticketIndex < 300; i++) {
      const contact = contacts[Math.floor(Math.random() * contacts.length)]
      const createdAt = randomDateInRange({ start: monthStart, end: monthEnd })
      const status = ticketStatuses[Math.floor(Math.random() * ticketStatuses.length)]
      const priority = ticketPriorities[Math.floor(Math.random() * ticketPriorities.length)]
      const category = ticketCategories[Math.floor(Math.random() * ticketCategories.length)]
      
      // Resolved/closed tickets should have resolvedAt
      const resolvedAt = ['resolved', 'closed'].includes(status)
        ? randomDateInRange({ start: createdAt, end: range.end })
        : null

      ticketData.push({
        tenantId,
        contactId: contact.id,
        subject: `Support Ticket ${ticketIndex + 1}: ${category} issue`,
        description: `Support ticket description for ${category} issue from ${contact.name}`,
        status,
        priority,
        category,
        assignedToId: userId,
        createdAt,
        resolvedAt,
        updatedAt: resolvedAt || createdAt,
      })
      ticketIndex++
    }
  }

  const tickets = await Promise.all(
    ticketData.map((ticket) =>
      anyPrisma.supportTicket.create({
        data: ticket,
      }).catch(() => null)
    )
  )

  const validTickets = tickets.filter(Boolean)
  console.log(`  ✓ Created ${validTickets.length} support tickets`)

  // 2. TICKET REPLIES - 2-8 replies per ticket
  const replies = []
  for (const ticket of validTickets) {
    if (!ticket) continue
    
    const numReplies = Math.floor(Math.random() * 7) + 2 // 2-8 replies
    const firstReplyDate = randomDateInRange({ start: ticket.createdAt, end: ticket.resolvedAt || range.end })
    
    for (let i = 0; i < numReplies; i++) {
      const replyDate = i === 0 
        ? firstReplyDate
        : randomDateInRange({ start: firstReplyDate, end: ticket.resolvedAt || range.end })
      
      const isFromSupport = i % 2 === 0 // Alternate between support and customer
      
      replies.push({
        tenantId,
        ticketId: ticket.id,
        content: `Reply ${i + 1} to ticket: ${ticket.subject}`,
        isFromSupport,
        authorId: isFromSupport ? userId : null,
        createdAt: replyDate,
      })
    }
  }

  // Batch create replies (limit to 2000)
  const repliesToCreate = replies.slice(0, 2000)
  const createdReplies = await Promise.all(
    repliesToCreate.map((reply) =>
      anyPrisma.supportReply.create({
        data: reply,
      }).catch(() => null)
    )
  )

  console.log(`  ✓ Created ${createdReplies.filter(Boolean).length} ticket replies`)

  return {
    tickets: validTickets.length,
    replies: createdReplies.filter(Boolean).length,
  }
}
