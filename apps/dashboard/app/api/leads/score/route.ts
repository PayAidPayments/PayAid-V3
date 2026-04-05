// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { updateLeadScore, scoreLead } from '@/lib/ai-helpers/lead-scoring'
import { scoreContactWithGroqAndPersist } from '@/lib/ai/lead-scorer-groq'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const scoreRequestSchema = z.object({
  contactId: z.string().optional(),
  batch: z.boolean().optional().default(false),
  useGroq: z.boolean().optional().default(false), // Phase 1A: India SMB Groq scoring
})

/**
 * POST /api/leads/score
 * Score a single lead or batch of leads
 */
export async function POST(request: NextRequest) {
  try {
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {}
    const params = { ...Object.fromEntries(request.nextUrl.searchParams), ...body }
    const { contactId, batch, useGroq } = scoreRequestSchema.parse(params)

    if (batch) {
      // Score all leads for this tenant
      const contacts = await prisma.contact.findMany({
        where: {
          tenantId: tenantId,
          type: 'lead',
        },
      })

      const results = await Promise.all(
        contacts.map(async (contact) => {
          const { score, components } = await scoreLead(contact)
          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              leadScore: score,
              scoreUpdatedAt: new Date(),
              scoreComponents: components as any,
            },
          })
          return {
            contactId: contact.id,
            name: contact.name,
            score,
            components,
          }
        })
      )

      return NextResponse.json({
        success: true,
        count: results.length,
        results,
      })
    } else if (contactId) {
      // Score single lead (Phase 1A: optional Groq India SMB scoring)
      if (useGroq && process.env.GROQ_API_KEY) {
        const groqResult = await scoreContactWithGroqAndPersist(contactId, tenantId)
        const contact = await prisma.contact.findUnique({
          where: { id: contactId },
          select: { id: true, name: true, nurtureStage: true, predictedRevenue: true },
        })
        return NextResponse.json({
          success: true,
          contactId,
          contactName: contact?.name,
          score: groqResult.score,
          stage: groqResult.stage,
          nurture_action: groqResult.nurture_action,
          predicted_mrr: groqResult.predicted_mrr,
          components: { groq: true, stage: groqResult.stage, nurture_action: groqResult.nurture_action, predicted_mrr_inr: groqResult.predicted_mrr },
          currentScore: contact?.leadScore,
          scoreUpdatedAt: new Date().toISOString(),
        })
      }
      const result = await updateLeadScore(contactId)
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { id: true, name: true },
      })

      return NextResponse.json({
        success: true,
        contactId,
        contactName: contact?.name,
        score: result.score,
        components: result.components,
      })
    } else {
      return NextResponse.json(
        { error: 'Either contactId or batch=true required' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Lead scoring error:', error)
    return NextResponse.json(
      {
        error: 'Failed to score leads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/leads/score?contactId=xxx
 * Get score for a specific lead
 */
export async function GET(request: NextRequest) {
  try {
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const searchParams = request.nextUrl.searchParams
    const contactId = searchParams.get('contactId')
    const useGroq = searchParams.get('useGroq') === 'true'

    if (!contactId) {
      return NextResponse.json(
        { error: 'contactId query parameter required' },
        { status: 400 }
      )
    }

    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId: tenantId,
      },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Phase 1A: optional Groq India SMB scoring
    if (useGroq && process.env.GROQ_API_KEY) {
      const groqResult = await scoreContactWithGroqAndPersist(contactId, tenantId)
      return NextResponse.json({
        contactId: contact.id,
        name: contact.name,
        score: groqResult.score,
        stage: groqResult.stage,
        nurture_action: groqResult.nurture_action,
        predicted_mrr: groqResult.predicted_mrr,
        components: { groq: true, stage: groqResult.stage, nurture_action: groqResult.nurture_action, predicted_mrr_inr: groqResult.predicted_mrr },
        currentScore: contact.leadScore,
        scoreUpdatedAt: new Date().toISOString(),
      })
    }

    const { score, components } = await scoreLead(contact)

    return NextResponse.json({
      contactId: contact.id,
      name: contact.name,
      score,
      components,
      currentScore: contact.leadScore,
      scoreUpdatedAt: contact.scoreUpdatedAt,
      nurtureStage: (contact as { nurtureStage?: string }).nurtureStage,
      predictedRevenue: (contact as { predictedRevenue?: unknown }).predictedRevenue,
    })
  } catch (error) {
    console.error('Get lead score error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get lead score',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
