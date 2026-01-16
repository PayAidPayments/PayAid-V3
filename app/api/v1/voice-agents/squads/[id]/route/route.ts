/**
 * Squad Routing API
 * POST /api/v1/voice-agents/squads/[id]/route - Route a call
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { getSquadRouter } from '@/lib/voice-agent/squad-router'
import { z } from 'zod'

const routeCallSchema = z.object({
  phone: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  language: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

// POST /api/v1/voice-agents/squads/[id]/route - Route a call
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const context = routeCallSchema.parse(body)

    const router = getSquadRouter()
    const agentId = await router.routeCall(params.id, {
      phone: context.phone,
      customerId: context.customerId,
      customerName: context.customerName,
      language: context.language,
      metadata: context.metadata,
    })

    return NextResponse.json({ agentId })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[Squads] Route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to route call' },
      { status: 500 }
    )
  }
}
