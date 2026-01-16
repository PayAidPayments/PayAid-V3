import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(1, 'Description is required'),
  customerId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  channel: z.enum(['email', 'chat', 'phone', 'whatsapp', 'web']).optional().default('web'),
})

// GET /api/support/tickets - Get all support tickets
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    // For now, return sample data - in production, create SupportTicket model
    // AI will auto-resolve tickets based on knowledge base and context
    const sampleTickets = [
      {
        id: 'ticket-1',
        ticketNumber: 'TKT-001',
        subject: 'Invoice payment issue',
        description: 'I cannot see my payment reflected in the invoice. Please help.',
        customerId: 'customer-1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        status: 'resolved' as const,
        priority: 'high' as const,
        assignedToId: 'user-1',
        assignedToName: 'Support Agent',
        channel: 'email' as const,
        aiResolved: true,
        aiConfidence: 0.92,
        tags: ['billing', 'payment'],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        resolvedAt: new Date(Date.now() - 3600000).toISOString(),
        responseTime: 15,
      },
      {
        id: 'ticket-2',
        ticketNumber: 'TKT-002',
        subject: 'Feature request: Export reports',
        description: 'Can you add the ability to export reports to Excel?',
        customerId: 'customer-2',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        status: 'open' as const,
        priority: 'medium' as const,
        channel: 'chat' as const,
        aiResolved: false,
        tags: ['feature-request'],
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ]

    let tickets = sampleTickets
    if (status && status !== 'all') {
      tickets = sampleTickets.filter(t => t.status === status)
    }

    return NextResponse.json({ tickets })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get tickets error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets', message: error?.message },
      { status: 500 }
    )
  }
}

// POST /api/support/tickets - Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createTicketSchema.parse(body)

    // Generate ticket number
    const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`

    // AI will attempt to auto-resolve based on knowledge base
    // For now, create ticket record
    // In production, create SupportTicket model

    return NextResponse.json({
      success: true,
      ticket: {
        id: `ticket_${Date.now()}`,
        ticketNumber,
        subject: validated.subject,
        description: validated.description,
        status: 'new',
        priority: validated.priority,
        channel: validated.channel,
        aiResolved: false,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      note: 'Ticket created. AI will attempt to auto-resolve based on knowledge base.',
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create ticket error:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket', message: error?.message },
      { status: 500 }
    )
  }
}
