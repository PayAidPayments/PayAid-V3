/**
 * Chat-specific trusted variable composition for SafePromptBuilder (D1).
 */

export function composeChatTrustedVariables(
  tenantId: string,
  context?: {
    module?: string
    page?: string
    businessName?: string
    entities?: string[]
    pageExtra?: unknown
  }
): Record<string, string> {
  const moduleLabel = context?.module || 'general'
  const pageLabel = context?.page || 'Home'
  const businessName = context?.businessName || 'this company'
  const entitiesList = context?.entities?.length ? context.entities.join(', ') : 'data on this page'
  const pageExtraSnap =
    context?.pageExtra != null && typeof context.pageExtra === 'object'
      ? `SCREEN DATA (use these counts; do not invent): ${JSON.stringify(context.pageExtra)}`
      : ''

  const variables: Record<string, string> = {
    tenantScope: `tenant_id=${tenantId}; module=${moduleLabel}; page=${pageLabel}`,
    businessName,
    moduleLabel,
    pageLabel,
  }

  if (context?.module && context?.page) {
    variables.pageScope = `You are PayAid AI for ${businessName}'s ${moduleLabel} → ${pageLabel}.
You ONLY help with this company's data on this page.
DO: answer about ${entitiesList} using current filters; use exact numbers; suggest page actions.
DON'T: personal questions, politics, news, health; external companies; other modules.
REFUSE non-business questions with: "I can only help with your company data on this page."
${pageExtraSnap}`
  }

  if (context?.module === 'crm') {
    variables.moduleScope = 'CRM: contacts, leads, deals, tasks'
  } else if (context?.module === 'accounting') {
    variables.moduleScope = 'Accounting: invoices, GST, financial reports, tax'
  } else if (context?.module === 'inventory') {
    variables.moduleScope = 'Inventory: stock, catalog, fulfillment, alerts'
  }

  return variables
}

export function composeChatTaskDeveloperExtras(message: string, contextAnalysis?: {
  hasEnoughContext?: boolean
  missingContext?: string[]
}): string {
  const lower = message.toLowerCase()
  const parts: string[] = []

  if (contextAnalysis && !contextAnalysis.hasEnoughContext && contextAnalysis.missingContext?.length) {
    parts.push(
      `CONTEXT WARNING: some information may be missing (${contextAnalysis.missingContext.join(', ')}). Ask ONE clarifying question if critical.`
    )
  }

  if (lower.includes('proposal') || lower.includes('quote')) {
    parts.push(
      'TASK: proposal/quote — use client, deal, and product data from untrusted context; produce a complete proposal ready to use.'
    )
  }
  if (
    lower.includes('post') ||
    lower.includes('linkedin') ||
    lower.includes('facebook') ||
    lower.includes('instagram') ||
    lower.includes('twitter')
  ) {
    const platform = lower.includes('linkedin')
      ? 'LinkedIn'
      : lower.includes('facebook')
        ? 'Facebook'
        : lower.includes('instagram')
          ? 'Instagram'
          : lower.includes('twitter')
            ? 'Twitter/X'
            : 'social media'
    parts.push(`TASK: create an actual ${platform} post ready to copy, not just suggestions.`)
  }
  if (lower.includes('pitch deck') || lower.includes('pitchdeck') || /\bpitch\b/.test(lower)) {
    parts.push('TASK: pitch deck outline with actual content from untrusted business data.')
  }
  if (lower.includes('business plan') || lower.includes('businessplan')) {
    parts.push('TASK: business plan sections using company and product data from untrusted context.')
  }

  return parts.join('\n')
}
