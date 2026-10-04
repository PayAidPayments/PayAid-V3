import { randomUUID } from 'node:crypto'
import {
  evaluateCustomerSpecialistEntitlement,
  type CustomerSpecialistCatalog,
} from '@/lib/ai/customer-specialists'
import { createCustomerFlowDraftId, persistCustomerFlowAudit } from './audit'
import type {
  CustomerFlowAuth,
  CustomerFlowDraftBundle,
  CustomerFlowResult,
  CustomerFlowStepResult,
} from './types'

export interface SalesFollowUpInput {
  contactName: string
  companyName?: string
  dealValueInr?: number
  notes?: string
  contactId?: string
  dealId?: string
  sessionId?: string
  /** When false, skip DB audit writes (unit/smoke). Default true. */
  persistAudit?: boolean
}

function scoreDeal(dealValueInr?: number, notes?: string): {
  score: number
  band: 'low' | 'medium' | 'high'
  risks: string[]
  nextActions: string[]
} {
  let score = 55
  const risks: string[] = []
  const nextActions: string[] = []

  if (typeof dealValueInr === 'number' && dealValueInr >= 250000) {
    score += 15
    nextActions.push('Prepare executive stakeholder map')
  } else if (typeof dealValueInr === 'number' && dealValueInr > 0) {
    score += 5
  } else {
    risks.push('Deal value missing')
    nextActions.push('Confirm budget range in discovery')
  }

  const noteText = (notes || '').toLowerCase()
  if (noteText.includes('competitor')) {
    score -= 10
    risks.push('Competitor mentioned')
    nextActions.push('Document differentiation vs named competitor')
  }
  if (noteText.includes('urgent') || noteText.includes('this month')) {
    score += 10
    nextActions.push('Propose a close plan for this month')
  }
  if (!noteText.trim()) {
    risks.push('No discovery notes yet')
  }

  score = Math.max(0, Math.min(100, score))
  const band = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low'
  if (nextActions.length === 0) nextActions.push('Book follow-up discovery call')
  return { score, band, risks, nextActions }
}

export async function runSalesFollowUpFlow(params: {
  catalog: CustomerSpecialistCatalog
  auth: CustomerFlowAuth
  input: SalesFollowUpInput
}): Promise<CustomerFlowResult> {
  const sessionId = params.input.sessionId?.trim() || `sales-follow-up-${randomUUID()}`
  const contactName = params.input.contactName.trim()
  if (!contactName) {
    return {
      allowed: false,
      reasonCode: 'VALIDATION_ERROR',
      reason: 'contactName is required',
      sessionId,
      auditIds: [],
      bundle: null,
    }
  }

  const baseContext = {
    tenantId: params.auth.tenantId,
    userId: params.auth.userId,
    roles: params.auth.roles,
    licensedModules: params.auth.licensedModules,
    requestedCapability: 'draft' as const,
  }

  const agentPlan: Array<{ slug: string; draftType: string }> = [
    { slug: 'sales-discovery-coach', draftType: 'discovery_call_plan' },
    { slug: 'sales-deal-strategist', draftType: 'deal_scorecard' },
    { slug: 'sales-proposal-strategist', draftType: 'proposal_draft' },
  ]

  const steps: CustomerFlowStepResult[] = []
  for (const step of agentPlan) {
    const decision = evaluateCustomerSpecialistEntitlement({
      catalog: params.catalog,
      agentSlug: step.slug,
      context: { ...baseContext, draftType: step.draftType },
    })
    steps.push({ agentSlug: step.slug, decision, draftType: step.draftType })
    if (!decision.allowed) {
      const denied: CustomerFlowResult = {
        allowed: false,
        reasonCode: decision.reasonCode,
        reason: decision.reason,
        sessionId,
        auditIds: [],
        bundle: {
          draftId: createCustomerFlowDraftId('sales-follow-up'),
          flow: 'sales-follow-up',
          status: 'draft',
          approvalStatus: 'denied',
          executable: false,
          createdAt: new Date().toISOString(),
          steps,
          draft: {},
        },
      }
      if (params.input.persistAudit !== false) {
        denied.auditIds = await persistCustomerFlowAudit({
          auth: params.auth,
          sessionId,
          flow: 'sales-follow-up',
          allowed: false,
          reasonCode: denied.reasonCode,
          reason: denied.reason,
          bundle: denied.bundle,
        })
      }
      return denied
    }
  }

  const deal = scoreDeal(params.input.dealValueInr, params.input.notes)
  const company = params.input.companyName?.trim() || 'the account'

  const discoveryDraft = {
    title: `Discovery plan for ${contactName}`,
    objective: `Qualify whether ${company} is a fit for PayAid and define mutual next steps.`,
    questions: [
      'What business process are you trying to improve in the next 90 days?',
      'Who else evaluates or approves this purchase?',
      'What does success look like in the first 30 days after go-live?',
      'What is the budget range and purchasing timeline?',
      'Which tools are you replacing or integrating with?',
    ],
    agenda: [
      'Confirm current workflow and pain points',
      'Map stakeholders and decision criteria',
      'Align on timeline and success metrics',
    ],
    contactId: params.input.contactId || null,
    notesSeed: params.input.notes || null,
  }

  const dealDraft = {
    title: `Deal scorecard for ${contactName}`,
    score: deal.score,
    band: deal.band,
    dealValueInr: params.input.dealValueInr ?? null,
    risks: deal.risks,
    nextActions: deal.nextActions,
    dealId: params.input.dealId || null,
  }

  const proposalDraft = {
    title: `Proposal draft for ${company}`,
    executiveSummary: `${contactName} at ${company} is evaluating PayAid to streamline operations. This draft outlines recommended modules, outcomes, and commercial talking points for review before any customer send.`,
    recommendedModules: ['crm', 'sales', ...(params.input.dealValueInr && params.input.dealValueInr >= 250000 ? ['finance'] : [])],
    pricingTalkingPoints: [
      'Start with the modules that unblock the first workflow',
      'Keep Phase 1 scoped to one operator loop with measurable outcomes',
      'Expand only after the first workflow is live and adopted',
    ],
    winThemes: [
      'Faster follow-up from lead to proposal',
      'Draft-first outbound with approval controls',
      'India-ready finance and GST continuity when needed',
    ],
    status: 'draft_not_sent',
  }

  const stepsWithDrafts = steps.map((step) => {
    if (step.agentSlug === 'sales-discovery-coach') return { ...step, draft: discoveryDraft }
    if (step.agentSlug === 'sales-deal-strategist') return { ...step, draft: dealDraft }
    if (step.agentSlug === 'sales-proposal-strategist') return { ...step, draft: proposalDraft }
    return step
  })

  const bundle: CustomerFlowDraftBundle = {
    draftId: createCustomerFlowDraftId('sales-follow-up'),
    flow: 'sales-follow-up',
    status: 'draft',
    approvalStatus: 'not_required',
    executable: false,
    createdAt: new Date().toISOString(),
    steps: stepsWithDrafts,
    draft: {
      contactName,
      companyName: company,
      discovery: discoveryDraft,
      dealScorecard: dealDraft,
      proposal: proposalDraft,
      sendStatus: 'not_sent',
    },
  }

  const result: CustomerFlowResult = {
    allowed: true,
    reasonCode: 'ALLOW',
    reason: 'Sales follow-up drafts created (nothing sent)',
    sessionId,
    auditIds: [],
    bundle,
  }

  if (params.input.persistAudit !== false) {
    result.auditIds = await persistCustomerFlowAudit({
      auth: params.auth,
      sessionId,
      flow: 'sales-follow-up',
      allowed: true,
      reasonCode: 'ALLOW',
      reason: result.reason,
      bundle,
    })
  }

  return result
}
