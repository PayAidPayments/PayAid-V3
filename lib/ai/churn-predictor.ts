/**
 * Phase 1B — Churn Predictor
 * Computes risk score (0-100) per contact from engagement, deals, invoices, WhatsApp.
 * Optionally uses Groq for reasonSummary and recommendedAction. India SMB, ₹ only.
 */

import { prisma } from '@/lib/db/prisma'
import { getGroqClient } from '@/lib/ai/groq'

export interface ChurnContact {
  id: string
  name: string
  company?: string | null
  stage?: string | null
  churnRiskScore: number
  churnReasonSummary?: string | null
  recommendedAction?: string | null
  dealValueAtRisk?: number
}

export interface ChurnDashboard {
  segments: { high: number; medium: number; low: number }
  totalAtRisk: number
  revenueAtRiskInr: number
  contacts: ChurnContact[]
}

const HIGH_RISK = 70
const MEDIUM_RISK = 40

/**
 * Compute churn risk score (0-100) for a contact from DB signals.
 */
export async function computeChurnRiskScore(contactId: string): Promise<number> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      deals: { where: { stage: { notIn: ['won', 'lost'] } }, select: { value: true } },
      invoices: { where: { status: { not: 'paid' } }, select: { total: true } },
      _count: { select: { interactions: true } },
    },
  })
  if (!contact) return 0

  let score = 0
  const now = new Date()

  // No contact in 30d → +35
  if (contact.lastContactedAt) {
    const daysSince = (now.getTime() - contact.lastContactedAt.getTime()) / (24 * 60 * 60 * 1000)
    if (daysSince >= 30) score += 35
    else if (daysSince >= 14) score += 20
    else if (daysSince >= 7) score += 10
  } else {
    score += 25
  }

  // No engagement (interactions) in 60d → +25
  const lastInteraction = await prisma.interaction.findFirst({
    where: { contactId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })
  if (!lastInteraction) score += 25
  else {
    const daysSince = (now.getTime() - lastInteraction.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    if (daysSince >= 60) score += 25
    else if (daysSince >= 30) score += 15
  }

  // Open deals with value → risk if slipping (simplified: any open deal = some risk)
  const openDealValue = contact.deals.reduce((s, d) => s + (Number(d.value) || 0), 0)
  if (openDealValue > 0) score += 15

  // Overdue / unpaid invoices → +20
  const unpaid = contact.invoices.reduce((s, i) => s + Number(i.total || 0), 0)
  if (unpaid > 0) score += 20

  // WhatsApp: replied = lower risk (we already have engagement)
  const wa = contact.whatsappStatus as { replied?: boolean } | null
  if (wa?.replied) score = Math.max(0, score - 15)

  return Math.min(100, Math.round(score))
}

/**
 * Get reason and action from Groq (optional). Returns null if no key or error.
 */
export async function getChurnReasonAndAction(
  contactName: string,
  riskScore: number,
  signals: { daysSinceContact?: number; openDealValue?: number; unpaidInr?: number }
): Promise<{ reasonSummary: string; recommendedAction: string } | null> {
  if (!process.env.GROQ_API_KEY) return null
  try {
    const groq = getGroqClient()
    const prompt = `For an Indian SMB customer with churn risk score ${riskScore}/100. Signals: ${signals.daysSinceContact != null ? `No contact in ${signals.daysSinceContact} days. ` : ''}${signals.openDealValue ? `Open deal value ₹${signals.openDealValue}. ` : ''}${signals.unpaidInr ? `Unpaid invoices ₹${signals.unpaidInr}. ` : ''}
Output valid JSON only: { "reasonSummary": "one short sentence", "recommendedAction": "one short actionable sentence" }. Currency ₹ only.`
    const raw = await groq.generateCompletion(prompt, 'You are a retention analyst for Indian SMBs. Output only JSON.')
    const str = raw.replace(/```\w*\n?/g, '').trim()
    const parsed = JSON.parse(str) as { reasonSummary?: string; recommendedAction?: string }
    return {
      reasonSummary: parsed.reasonSummary || 'Risk factors detected.',
      recommendedAction: parsed.recommendedAction || 'Schedule check-in call.',
    }
  } catch {
    return null
  }
}

/**
 * Build churn dashboard for tenant: segments (high/medium/low), contacts with score/reason/action.
 */
export async function getChurnDashboard(tenantId: string): Promise<ChurnDashboard> {
  const contacts = await prisma.contact.findMany({
    where: { tenantId, stage: 'customer' },
    select: {
      id: true,
      name: true,
      company: true,
      stage: true,
      lastContactedAt: true,
      whatsappStatus: true,
      deals: { where: { stage: { notIn: ['won', 'lost'] } }, select: { value: true } },
      invoices: { where: { status: { not: 'paid' } }, select: { total: true } },
    },
  })

  const withScore: ChurnContact[] = []
  for (const c of contacts) {
    const score = await computeChurnRiskScore(c.id)
    const openDealValue = c.deals.reduce((s, d) => s + (Number(d.value) || 0), 0)
    const unpaidInr = c.invoices.reduce((s, i) => s + Number(i.total || 0), 0)
    let reasonSummary: string | null = null
    let recommendedAction: string | null = null

    if (score >= MEDIUM_RISK) {
      const daysSince = c.lastContactedAt
        ? Math.floor((Date.now() - c.lastContactedAt.getTime()) / (24 * 60 * 60 * 1000))
        : undefined
      const groqResult = await getChurnReasonAndAction(c.name, score, {
        daysSinceContact: daysSince,
        openDealValue: openDealValue || undefined,
        unpaidInr: unpaidInr || undefined,
      })
      if (groqResult) {
        reasonSummary = groqResult.reasonSummary
        recommendedAction = groqResult.recommendedAction
      } else {
        reasonSummary = reasonSummary || 'Declining engagement or payment delay.'
        recommendedAction = 'Schedule check-in call or send renewal reminder.'
      }
    }

    withScore.push({
      id: c.id,
      name: c.name,
      company: c.company,
      stage: c.stage,
      churnRiskScore: score,
      churnReasonSummary: reasonSummary,
      recommendedAction,
      dealValueAtRisk: openDealValue || undefined,
    })
  }

  const high = withScore.filter((c) => c.churnRiskScore >= HIGH_RISK).length
  const medium = withScore.filter((c) => c.churnRiskScore >= MEDIUM_RISK && c.churnRiskScore < HIGH_RISK).length
  const low = withScore.filter((c) => c.churnRiskScore < MEDIUM_RISK).length
  const atRisk = withScore.filter((c) => c.churnRiskScore >= MEDIUM_RISK)
  const revenueAtRiskInr = atRisk.reduce((s, c) => s + (c.dealValueAtRisk || 0), 0)

  return {
    segments: { high, medium, low },
    totalAtRisk: atRisk.length,
    revenueAtRiskInr,
    contacts: withScore.sort((a, b) => b.churnRiskScore - a.churnRiskScore),
  }
}

/**
 * Get high-risk customers for a tenant (score >= minRiskScore).
 * Used by /api/crm/analytics/churn-risk.
 */
export async function getHighRiskCustomers(
  tenantId: string,
  minRiskScore: number = 60
): Promise<ChurnContact[]> {
  const dashboard = await getChurnDashboard(tenantId)
  return dashboard.contacts.filter((c) => c.churnRiskScore >= minRiskScore)
}

export type ChurnRiskLevel = 'critical' | 'high' | 'medium' | 'low'

/**
 * Calculate churn risk for a single contact. Returns score and level.
 * Used by scenario-planner for retention actions.
 */
export async function calculateChurnRisk(params: {
  contactId: string
  tenantId: string
}): Promise<{ riskScore: number; riskLevel: ChurnRiskLevel }> {
  const score = await computeChurnRiskScore(params.contactId)
  let riskLevel: ChurnRiskLevel = 'low'
  if (score >= 70) riskLevel = 'critical'
  else if (score >= 40) riskLevel = 'high'
  else if (score >= 20) riskLevel = 'medium'
  return { riskScore: score, riskLevel }
}
