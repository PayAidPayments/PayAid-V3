import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed'

interface SupportTicketRow {
  id: string
  ticketNumber: string
  subject: string
  description: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  status: TicketStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedToId?: string
  assignedToName?: string
  channel: 'email' | 'chat' | 'phone' | 'whatsapp' | 'web'
  aiResolved: boolean
  aiConfidence?: number
  tags: string[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  responseTime?: number
}

function demoTickets(): SupportTicketRow[] {
  const now = Date.now()
  return [
    {
      id: 'demo-tkt-1',
      ticketNumber: 'TKT-2401',
      subject: 'GST invoice mismatch',
      description: 'Customer reports wrong HSN on last month’s invoice.',
      customerName: 'Acme Trading Co',
      customerEmail: 'accounts@acme.example.com',
      status: 'open',
      priority: 'high',
      assignedToName: 'Support',
      channel: 'email',
      aiResolved: false,
      tags: ['billing', 'gst'],
      createdAt: new Date(now - 5 * 3600_000).toISOString(),
      updatedAt: new Date(now - 4 * 3600_000).toISOString(),
    },
    {
      id: 'demo-tkt-2',
      ticketNumber: 'TKT-2402',
      subject: 'CRM sync delay',
      description: 'Leads from website form not appearing for 10 minutes.',
      customerName: 'Northwind India',
      customerEmail: 'ops@northwind.example.com',
      status: 'open',
      priority: 'medium',
      channel: 'web',
      aiResolved: false,
      tags: ['crm', 'integration'],
      createdAt: new Date(now - 26 * 3600_000).toISOString(),
      updatedAt: new Date(now - 25 * 3600_000).toISOString(),
    },
    {
      id: 'demo-tkt-3',
      ticketNumber: 'TKT-2403',
      subject: 'User cannot reset password',
      description: 'Reset email not received; spam folder checked.',
      customerName: 'Priya Sharma',
      customerEmail: 'priya@example.com',
      status: 'new',
      priority: 'medium',
      channel: 'chat',
      aiResolved: false,
      tags: ['access'],
      createdAt: new Date(now - 2 * 3600_000).toISOString(),
      updatedAt: new Date(now - 2 * 3600_000).toISOString(),
    },
    {
      id: 'demo-tkt-4',
      ticketNumber: 'TKT-2398',
      subject: 'Feature: export pipeline to Excel',
      description: 'Request logged for product roadmap.',
      customerName: 'Global Solutions',
      customerEmail: 'crm@globalsol.example.com',
      status: 'resolved',
      priority: 'low',
      channel: 'email',
      aiResolved: true,
      aiConfidence: 0.88,
      tags: ['feature-request'],
      createdAt: new Date(now - 9 * 86400_000).toISOString(),
      updatedAt: new Date(now - 8 * 86400_000).toISOString(),
      resolvedAt: new Date(now - 8 * 86400_000).toISOString(),
      responseTime: 120,
    },
  ]
}

// GET /api/support/tickets — sample data until a SupportTicket model is wired
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'crm')

    const status = request.nextUrl.searchParams.get('status')
    let tickets = demoTickets()
    if (status && status !== 'all') {
      tickets = tickets.filter((t) => t.status === status)
    }

    return NextResponse.json({ tickets })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    const message = error instanceof Error ? error.message : String(error)
    console.error('[support/tickets]', message)
    return NextResponse.json({ error: 'Failed to fetch tickets', message }, { status: 500 })
  }
}
