/**
 * POST /api/nurture/generate-ai
 * AI (Groq) generates a 3-touch nurture sequence for India SMB: day 0, 2, 5.
 * Body: { tenantId, name?, industry?, contactId? }.
 * Creates NurtureTemplate + NurtureSteps (channel: email or whatsapp), returns template id.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { getGroqClient } from '@/lib/ai/groq'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().optional(),
  industry: z.string().optional(),
  contactId: z.string().optional(),
})

const STEP_DAYS = [0, 2, 5]
const CHANNELS = ['whatsapp', 'email', 'email'] as const

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json().catch(() => ({}))
    const { name, industry, contactId } = bodySchema.parse(body)

    const groq = getGroqClient()
    const prompt = `Generate a 3-touch nurture sequence for an Indian SMB lead. Touch 1 (day 0): WhatsApp - short intro and CTA. Touch 2 (day 2): Email - value tip. Touch 3 (day 5): Email - gentle reminder. Industry: ${industry || 'general'}. Use Indian English and ₹ only. Output valid JSON only with this structure: { "steps": [ { "dayNumber": 0, "channel": "whatsapp", "subject": null, "body": "..." }, { "dayNumber": 2, "channel": "email", "subject": "...", "body": "..." }, { "dayNumber": 5, "channel": "email", "subject": "...", "body": "..." } ] }. No markdown.`
    const raw = await groq.generateCompletion(
      prompt,
      'You are a B2B nurture copywriter for Indian SMBs. Output only valid JSON.'
    )
    let parsed: { steps?: Array<{ dayNumber: number; channel: string; subject?: string | null; body: string }> }
    try {
      const str = raw.replace(/```\w*\n?/g, '').trim()
      parsed = JSON.parse(str)
    } catch {
      return NextResponse.json({ error: 'AI did not return valid JSON', raw: raw.slice(0, 200) }, { status: 500 })
    }

    const steps = (parsed.steps || []).slice(0, 3)
    const templateName = name || `AI Nurture ${industry || 'General'} ${new Date().toISOString().slice(0, 10)}`

    const template = await prisma.nurtureTemplate.create({
      data: {
        tenantId,
        name: templateName,
        description: `AI-generated 3-touch (day 0, 2, 5). ${industry ? `Industry: ${industry}` : ''}`,
      },
    })

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i]
      await prisma.nurtureStep.create({
        data: {
          templateId: template.id,
          dayNumber: STEP_DAYS[i] ?? s.dayNumber ?? i,
          channel: (s.channel || CHANNELS[i] || 'email').toLowerCase(),
          subject: s.subject ?? null,
          body: s.body || '',
          order: i + 1,
        },
      })
    }

    if (contactId) {
      const stepsCount = await prisma.nurtureStep.count({ where: { templateId: template.id } })
      await prisma.nurtureEnrollment.create({
        data: {
          contactId,
          templateId: template.id,
          tenantId,
          totalSteps: stepsCount,
        },
      })
    }

    return NextResponse.json({
      success: true,
      templateId: template.id,
      name: template.name,
      stepsCount: steps.length,
      contactEnrolled: !!contactId,
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: e.errors }, { status: 400 })
    }
    console.error('Nurture generate-ai error:', e)
    return NextResponse.json(
      { error: 'Failed to generate sequence', details: e instanceof Error ? e.message : 'Unknown' },
      { status: 500 }
    )
  }
}
