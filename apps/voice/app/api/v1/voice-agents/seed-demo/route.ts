/**
 * POST /api/v1/voice-agents/seed-demo
 * Creates 2–3 demo voice agents for the tenant (Ravi, Priya, Survey).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { authenticateRequest } from '@/lib/middleware/auth'

const DEMO_AGENTS = [
  {
    name: 'Ravi',
    description: 'Invoice reminders and payment follow-up',
    language: 'hi',
    systemPrompt: 'You are Ravi, a professional voice agent for payment reminders. Greet the customer in Hindi, confirm their name, and briefly remind them about the pending invoice. Be polite and offer to send a payment link or callback if needed.',
  },
  {
    name: 'Priya',
    description: 'Lead nurturing and follow-up calls',
    language: 'en',
    systemPrompt: 'You are Priya, a friendly voice agent for lead follow-up. Greet the lead, ask if they had a chance to review the proposal, and offer to answer questions or schedule a callback from the sales team.',
  },
  {
    name: 'Survey',
    description: 'Customer satisfaction and NPS surveys',
    language: 'en',
    systemPrompt: 'You are a short survey agent. Thank the customer, ask one NPS question (0–10), and optionally one follow-up. Keep the call under 2 minutes.',
  },
]

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.voiceAgent.count({
      where: { tenantId: user.tenantId },
    })
    if (existing > 0) {
      return NextResponse.json(
        { error: 'You already have agents. Create new ones from the table.', agentsCount: existing },
        { status: 400 }
      )
    }

    const created = await prisma.voiceAgent.createMany({
      data: DEMO_AGENTS.map((a) => ({
        tenantId: user.tenantId!,
        name: a.name,
        description: a.description,
        language: a.language,
        systemPrompt: a.systemPrompt,
        status: 'active',
      })),
    })

    return NextResponse.json({
      success: true,
      created: created.count,
      message: `${created.count} demo agents created. You can edit them or create more.`,
    })
  } catch (error) {
    console.error('[VoiceAgents] seed-demo error:', error)
    return NextResponse.json(
      { error: 'Failed to create demo agents' },
      { status: 500 }
    )
  }
}
