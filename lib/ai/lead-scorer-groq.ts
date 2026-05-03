/**
 * Phase 1A: AI Lead Scorer (Groq) — India SMB only
 * Scores leads 0-100 using: industry fit (retail/F&B), WhatsApp engagement,
 * business size, pain signals (GST, compliance). Outputs stage + nurture_action + predicted_mrr (₹ INR).
 * STRICT: India-only. No $ or foreign formats.
 */

import { getGroqClient } from '@/lib/ai/groq'
import { prisma } from '@/lib/db/prisma'

const INDIA_SMB_SYSTEM_PROMPT = `You are a lead scoring engine for PayAid, an India-first Business OS for SMBs.
Score Indian SMB leads only. Output valid JSON only, no markdown or extra text.
Currency: always use INR (₹). Never use USD, EUR, or $.
Scoring factors (total 100):
- Industry fit: PayAid is strong in retail, F&B, services, manufacturing, ecom. Award up to 30 points for these.
- WhatsApp engagement: opened = 20pts, replied = 40pts, sent but no open = 5pts.
- Business size: 10+ employees = 30pts, 5-9 = 20pts, 1-4 = 10pts. Unknown = 5pts.
- Pain signals: notes/context mention "GST", "e-invoicing", "compliance", "billing" = 20pts total (split as relevant).
Output JSON with keys: score (0-100), stage ("hot"|"warm"|"cold"), nurture_action (one short sentence), predicted_mrr (number, INR only).`

export interface GroqLeadScoreResult {
  score: number
  stage: 'hot' | 'warm' | 'cold'
  nurture_action: string
  predicted_mrr: number
}

export interface LeadInputForGroq {
  industry?: string | null
  company?: string | null
  notes?: string | null
  source?: string | null
  /** WhatsApp: { sent, opened, replied } */
  whatsapp_status?: { sent?: boolean; opened?: boolean; replied?: boolean } | null
  /** Approximate employee count if known */
  employee_count?: number | null
  /** Recent interaction count */
  interaction_count?: number
  tenant_industry?: string | null
}

/**
 * Build a concise lead summary for the LLM (India SMB context only).
 */
function buildLeadSummary(input: LeadInputForGroq): string {
  const parts: string[] = []
  if (input.industry) parts.push(`Industry: ${input.industry}`)
  if (input.company) parts.push(`Company: ${input.company}`)
  if (input.tenant_industry) parts.push(`Tenant industry: ${input.tenant_industry}`)
  if (input.source) parts.push(`Source: ${input.source}`)
  if (input.employee_count != null) parts.push(`Employees: ~${input.employee_count}`)
  if (input.interaction_count != null) parts.push(`Recent interactions: ${input.interaction_count}`)
  const wa = input.whatsapp_status
  if (wa) {
    const waParts: string[] = []
    if (wa.sent) waParts.push('sent')
    if (wa.opened) waParts.push('opened')
    if (wa.replied) waParts.push('replied')
    if (waParts.length) parts.push(`WhatsApp: ${waParts.join(', ')}`)
  }
  if (input.notes) parts.push(`Notes: ${input.notes.slice(0, 300)}`)
  return parts.join('. ') || 'No additional context.'
}

/**
 * Parse Groq JSON response. Tolerates markdown code blocks.
 */
function parseGroqScoreJson(raw: string): GroqLeadScoreResult {
  let str = raw.trim()
  const codeBlock = str.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) str = codeBlock[1].trim()
  const parsed = JSON.parse(str) as Record<string, unknown>
  const score = Math.min(100, Math.max(0, Number(parsed.score) || 0))
  const stage = (['hot', 'warm', 'cold'].includes(String(parsed.stage)) ? parsed.stage : 'cold') as 'hot' | 'warm' | 'cold'
  const nurture_action = String(parsed.nurture_action || 'Follow up with next touchpoint.')
  const predicted_mrr = Math.max(0, Number(parsed.predicted_mrr) || 0)
  return { score, stage, nurture_action, predicted_mrr }
}

/**
 * Score a single lead using Groq (India SMB prompt). Returns stage, nurture_action, predicted_mrr in INR.
 */
export async function scoreLeadWithGroq(input: LeadInputForGroq): Promise<GroqLeadScoreResult> {
  const groq = getGroqClient()
  const userPrompt = `Score this Indian SMB lead. ${buildLeadSummary(input)}`
  const raw = await groq.generateCompletion(userPrompt, INDIA_SMB_SYSTEM_PROMPT)
  return parseGroqScoreJson(raw)
}

/**
 * Load contact + tenant and WhatsApp/conversation signals, then score with Groq.
 * Updates contact with leadScore, scoreUpdatedAt, scoreComponents, nurtureStage, predictedRevenue, whatsappStatus (if provided).
 */
export async function scoreContactWithGroqAndPersist(
  contactId: string,
  tenantId: string,
  options: { whatsappStatus?: { sent?: boolean; opened?: boolean; replied?: boolean } } = {}
): Promise<GroqLeadScoreResult> {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, tenantId },
    include: {
      tenant: { select: { industry: true } },
      whatsappIdentities: { select: { whatsappNumber: true } },
      _count: { select: { interactions: true } },
    },
  })

  if (!contact) {
    throw new Error('Contact not found')
  }

  // WhatsApp status: from options or existing contact field
  const whatsappStatus = options.whatsappStatus ?? (contact.whatsappStatus as LeadInputForGroq['whatsapp_status']) ?? undefined

  const input: LeadInputForGroq = {
    industry: contact.source ?? undefined,
    company: contact.company,
    notes: contact.notes,
    source: contact.source,
    whatsapp_status: whatsappStatus,
    employee_count: null,
    interaction_count: contact._count.interactions,
    tenant_industry: contact.tenant?.industry ?? undefined,
  }

  const result = await scoreLeadWithGroq(input)

  const scoreComponents = {
    groq: true,
    stage: result.stage,
    nurture_action: result.nurture_action,
    predicted_mrr_inr: result.predicted_mrr,
  }

  await prisma.contact.update({
    where: { id: contactId },
    data: {
      leadScore: result.score,
      scoreUpdatedAt: new Date(),
      scoreComponents: { ...((contact.scoreComponents as object) || {}), groq: true, stage: result.stage, nurture_action: result.nurture_action, predicted_mrr_inr: result.predicted_mrr },
      nurtureStage: result.stage,
      predictedRevenue: result.predicted_mrr,
      ...(whatsappStatus && { whatsappStatus: whatsappStatus as object }),
    },
  })

  return result
}
