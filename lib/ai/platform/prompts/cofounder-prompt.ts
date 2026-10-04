/**
 * Co-Founder / agent trusted variable composition for SafePromptBuilder (D1).
 *
 * Specialist agent.* templates already embed systemPrompt in trustedSystem —
 * only pass a short agentRole note there. cofounder.base uses agentRole for
 * the longer strategic persona from AGENTS.cofounder.
 */

export function composeCofounderTrustedVariables(params: {
  agentId: string
  agentName: string
  /** Used for cofounder.base agentRole; ignored for specialist templates */
  agentSystemPrompt: string
  tenantId?: string
  userId?: string
  moduleScope?: string
  timeRangeDays?: number
  coordinationNote?: string
  industryPrompts?: string
}): Record<string, string> {
  const variables: Record<string, string> = {
    agentId: params.agentId,
    agentName: params.agentName,
  }

  if (params.tenantId || params.userId) {
    variables.tenantScope = [
      params.tenantId ? `Tenant ID: ${params.tenantId}` : '',
      params.userId ? `User ID: ${params.userId}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }

  if (params.agentId === 'cofounder') {
    variables.agentRole = `${params.agentSystemPrompt}

IMPORTANT: You are the ${params.agentName} agent. You can coordinate with specialist agents when needed.`
  } else {
    variables.agentRole = `Operating as ${params.agentName}. Stay in-domain; suggest Co-Founder or another specialist when out of scope.`
  }

  if (params.moduleScope) {
    variables.moduleScope = `Only use data from the ${params.moduleScope.toUpperCase()} module.`
  }
  if (params.timeRangeDays != null && params.timeRangeDays !== 30) {
    variables.timeRange = `Focus metrics and analysis on the last ${params.timeRangeDays} days.`
  }
  if (params.coordinationNote?.trim()) {
    variables.coordination = params.coordinationNote.trim()
  }
  if (params.industryPrompts?.trim()) {
    variables.industryContext = params.industryPrompts.trim()
  }

  return variables
}
