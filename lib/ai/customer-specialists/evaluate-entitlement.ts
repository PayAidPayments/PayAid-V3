import type {
  CustomerEntitlementContext,
  CustomerEntitlementDecision,
  CustomerSpecialistAgent,
  CustomerSpecialistCatalog,
} from './types'

function normalizeList(values?: string[] | null): string[] {
  if (!values) return []
  return values
    .map((v) => String(v || '').trim().toLowerCase())
    .filter(Boolean)
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values))
}

export function findCustomerSpecialist(
  catalog: CustomerSpecialistCatalog,
  slug: string
): CustomerSpecialistAgent | undefined {
  const needle = String(slug || '').trim()
  if (!needle) return undefined
  return catalog.agents.find((agent) => agent.slug === needle)
}

/**
 * Fail-closed entitlement check for customer specialists.
 * Unknown agent, missing auth, missing module, or role mismatch => deny.
 */
export function evaluateCustomerSpecialistEntitlement(params: {
  catalog: CustomerSpecialistCatalog
  agentSlug: string
  context: CustomerEntitlementContext
}): CustomerEntitlementDecision {
  const agent = findCustomerSpecialist(params.catalog, params.agentSlug)
  if (!agent) {
    return {
      allowed: false,
      reasonCode: 'AGENT_UNKNOWN',
      reason: `Unknown customer specialist: ${params.agentSlug}`,
      agentSlug: params.agentSlug,
      auditRequired: true,
      matchedModules: [],
    }
  }

  const entitlement = agent.entitlement
  if (!entitlement || !Array.isArray(entitlement.modulesAny) || entitlement.modulesAny.length === 0) {
    return {
      allowed: false,
      reasonCode: 'INVALID_ENTITLEMENT_HEADER',
      reason: `Invalid entitlement header for ${agent.slug}`,
      agentSlug: agent.slug,
      auditRequired: true,
      matchedModules: [],
    }
  }

  const tenantId = String(params.context.tenantId || '').trim()
  const userId = String(params.context.userId || '').trim()
  if (!tenantId || !userId) {
    return {
      allowed: false,
      reasonCode: 'AUTH_REQUIRED',
      reason: 'tenantId and userId are required',
      agentSlug: agent.slug,
      auditRequired: true,
      matchedModules: [],
    }
  }

  const licensed = unique(normalizeList(params.context.licensedModules))
  const modulesAny = unique(normalizeList(entitlement.modulesAny))
  const modulesAll = unique(normalizeList(entitlement.modulesAll))
  const matchedModules = modulesAny.filter((moduleId) => licensed.includes(moduleId))

  if (entitlement.denyWithoutModule !== false && matchedModules.length === 0) {
    return {
      allowed: false,
      reasonCode: 'MODULE_NOT_LICENSED',
      reason: `Tenant lacks required module for ${agent.slug} (need one of: ${modulesAny.join(', ')})`,
      agentSlug: agent.slug,
      auditRequired: true,
      matchedModules: [],
    }
  }

  const missingAll = modulesAll.filter((moduleId) => !licensed.includes(moduleId))
  if (missingAll.length > 0) {
    return {
      allowed: false,
      reasonCode: 'MODULE_NOT_LICENSED',
      reason: `Tenant missing required modules: ${missingAll.join(', ')}`,
      agentSlug: agent.slug,
      auditRequired: true,
      matchedModules,
    }
  }

  const roles = unique(normalizeList(params.context.roles))
  const minRoles = unique(normalizeList(entitlement.minRoles))
  if (minRoles.length > 0 && !roles.some((role) => minRoles.includes(role))) {
    return {
      allowed: false,
      reasonCode: 'ROLE_DENIED',
      reason: `Role not permitted for ${agent.slug}`,
      agentSlug: agent.slug,
      auditRequired: true,
      matchedModules,
    }
  }

  const capability = params.context.requestedCapability || (agent.actionMode === 'draft' ? 'draft' : 'read')
  const forbidden = new Set(normalizeList(entitlement.forbiddenCapabilities))
  if (forbidden.has(capability)) {
    return {
      allowed: false,
      reasonCode: 'CAPABILITY_FORBIDDEN',
      reason: `Capability '${capability}' is forbidden for ${agent.slug}`,
      agentSlug: agent.slug,
      auditRequired: true,
      matchedModules,
    }
  }

  const draftType = String(params.context.draftType || '').trim()
  if (draftType) {
    const allowedDrafts = new Set(entitlement.draftTypes || [])
    if (!allowedDrafts.has(draftType)) {
      return {
        allowed: false,
        reasonCode: 'DRAFT_TYPE_FORBIDDEN',
        reason: `Draft type '${draftType}' is not allowed for ${agent.slug}`,
        agentSlug: agent.slug,
        auditRequired: true,
        matchedModules,
      }
    }
  }

  return {
    allowed: true,
    reasonCode: 'ALLOW',
    reason: `Allowed ${agent.slug} via modules [${matchedModules.join(', ')}]`,
    agentSlug: agent.slug,
    auditRequired: entitlement.auditRequired !== false,
    matchedModules,
  }
}
