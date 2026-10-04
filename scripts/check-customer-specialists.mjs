#!/usr/bin/env node
/**
 * Validates PayAid customer specialist Phase 2 catalog:
 * - divisions/agents present
 * - entitlement headers complete + fail closed
 * - module IDs align with lib/modules/catalog.ts
 * - approval policies known
 * - evaluator + docs exist
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const LICENSE_MODULE_IDS = new Set([
  'crm',
  'sales',
  'marketing',
  'finance',
  'hr',
  'communication',
  'ai-studio',
  'analytics',
  'projects',
  'inventory',
])

const APPROVAL_POLICIES = new Set([
  'read-only',
  'draft-first',
  'guarded-ops',
  'external-actions',
  'destructive',
])

const ACTION_MODES = new Set(['advise', 'draft'])

function readJson(rel) {
  const full = path.join(root, rel)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${rel}`)
  return JSON.parse(fs.readFileSync(full, 'utf8'))
}

function fail(msg) {
  console.error(`FAIL: ${msg}`)
  process.exitCode = 1
}

function assertArray(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array`)
  return Array.isArray(value) ? value : []
}

function main() {
  const requiredDocs = [
    'docs/ai/customer/README.md',
    'docs/ai/customer/entitlement-header.md',
    'docs/ai/payaid-specialists.md',
    'docs/ai/payaid-specialist-router.md',
    'docs/ai/payaid-specialist-permissions.md',
    'docs/ai/agent-routing-matrix.md',
    'lib/ai/customer-specialists/evaluate-entitlement.ts',
    'lib/ai/customer-specialists/catalog.ts',
    'lib/ai/customer-specialists/types.ts',
    'lib/ai/customer-specialists/index.ts',
  ]
  for (const rel of requiredDocs) {
    if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`)
  }

  const divisionsDoc = readJson('docs/ai/customer/divisions.json')
  const agentsDoc = readJson('docs/ai/customer/agents.json')

  if (divisionsDoc.pack !== 'customer') fail('divisions.pack must be customer')
  if (agentsDoc.pack !== 'customer') fail('agents.pack must be customer')
  if (!agentsDoc.entitlementHeaderVersion) fail('agents.entitlementHeaderVersion missing')

  const divisionKeys = Object.keys(divisionsDoc.divisions || {})
  if (divisionKeys.length < 5) fail(`expected >=5 divisions, found ${divisionKeys.length}`)

  const agents = assertArray(agentsDoc.agents, 'agents')
  if (agents.length < 12) fail(`expected >=12 agents, found ${agents.length}`)

  const slugs = new Set()
  for (const agent of agents) {
    if (!agent.slug) {
      fail('agent missing slug')
      continue
    }
    if (slugs.has(agent.slug)) fail(`duplicate slug: ${agent.slug}`)
    slugs.add(agent.slug)

    if (!divisionKeys.includes(agent.division)) {
      fail(`agent ${agent.slug} unknown division: ${agent.division}`)
    }
    if (!ACTION_MODES.has(agent.actionMode)) {
      fail(`agent ${agent.slug} invalid actionMode: ${agent.actionMode}`)
    }
    if (!APPROVAL_POLICIES.has(agent.approvalPolicy)) {
      fail(`agent ${agent.slug} invalid approvalPolicy: ${agent.approvalPolicy}`)
    }

    const ent = agent.entitlement
    if (!ent) {
      fail(`agent ${agent.slug} missing entitlement header`)
      continue
    }
    if (ent.denyWithoutModule !== true) {
      fail(`agent ${agent.slug} denyWithoutModule must be true`)
    }
    if (ent.auditRequired !== true) {
      fail(`agent ${agent.slug} auditRequired must be true`)
    }

    const modulesAny = assertArray(ent.modulesAny, `${agent.slug}.modulesAny`)
    if (modulesAny.length === 0) fail(`agent ${agent.slug} modulesAny empty`)
    for (const moduleId of modulesAny) {
      if (!LICENSE_MODULE_IDS.has(moduleId)) {
        fail(`agent ${agent.slug} unknown module in modulesAny: ${moduleId}`)
      }
    }
    for (const moduleId of assertArray(ent.modulesAll, `${agent.slug}.modulesAll`)) {
      if (!LICENSE_MODULE_IDS.has(moduleId)) {
        fail(`agent ${agent.slug} unknown module in modulesAll: ${moduleId}`)
      }
    }
    if (assertArray(ent.minRoles, `${agent.slug}.minRoles`).length === 0) {
      fail(`agent ${agent.slug} minRoles empty`)
    }
    assertArray(ent.dataRead, `${agent.slug}.dataRead`)
    assertArray(ent.draftTypes, `${agent.slug}.draftTypes`)
    const forbidden = assertArray(ent.forbiddenCapabilities, `${agent.slug}.forbiddenCapabilities`)
    if (!forbidden.includes('send')) {
      fail(`agent ${agent.slug} must forbid send`)
    }
    if (agent.actionMode === 'draft' && ent.draftTypes.length === 0) {
      fail(`draft agent ${agent.slug} must declare draftTypes`)
    }
    if (agent.actionMode === 'advise' && ent.draftTypes.length > 0) {
      fail(`advise agent ${agent.slug} should not declare draftTypes`)
    }
  }

  const expected = [
    'sales-discovery-coach',
    'sales-deal-strategist',
    'sales-pipeline-analyst',
    'sales-proposal-strategist',
    'finance-bookkeeper',
    'finance-fpa-analyst',
    'marketing-content-creator',
    'marketing-email-strategist',
    'marketing-seo-specialist',
    'support-responder',
    'support-executive-summary-generator',
    'success-customer-success-manager',
  ]
  for (const slug of expected) {
    if (!slugs.has(slug)) fail(`missing required agent: ${slug}`)
  }

  // Fail-closed smoke (mirrors lib/ai/customer-specialists/evaluate-entitlement.ts)
  function decide(agentSlug, context) {
    const agent = agents.find((a) => a.slug === agentSlug)
    if (!agent) return 'AGENT_UNKNOWN'
    const ent = agent.entitlement
    if (!context.tenantId || !context.userId) return 'AUTH_REQUIRED'
    const licensed = new Set((context.licensedModules || []).map((m) => String(m).toLowerCase()))
    const matched = (ent.modulesAny || []).filter((m) => licensed.has(String(m).toLowerCase()))
    if (ent.denyWithoutModule && matched.length === 0) return 'MODULE_NOT_LICENSED'
    const roles = new Set((context.roles || []).map((r) => String(r).toLowerCase()))
    const minRoles = (ent.minRoles || []).map((r) => String(r).toLowerCase())
    if (minRoles.length && ![...roles].some((r) => minRoles.includes(r))) return 'ROLE_DENIED'
    const capability = context.requestedCapability || (agent.actionMode === 'draft' ? 'draft' : 'read')
    if ((ent.forbiddenCapabilities || []).map((c) => String(c).toLowerCase()).includes(capability)) {
      return 'CAPABILITY_FORBIDDEN'
    }
    return 'ALLOW'
  }

  const smokeCases = [
    {
      name: 'crm member can draft discovery',
      expect: 'ALLOW',
      slug: 'sales-discovery-coach',
      context: {
        tenantId: 't1',
        userId: 'u1',
        roles: ['member'],
        licensedModules: ['crm'],
        requestedCapability: 'draft',
      },
    },
    {
      name: 'finance denied without finance module',
      expect: 'MODULE_NOT_LICENSED',
      slug: 'finance-bookkeeper',
      context: {
        tenantId: 't1',
        userId: 'u1',
        roles: ['admin'],
        licensedModules: ['crm'],
        requestedCapability: 'draft',
      },
    },
    {
      name: 'email strategist cannot send',
      expect: 'CAPABILITY_FORBIDDEN',
      slug: 'marketing-email-strategist',
      context: {
        tenantId: 't1',
        userId: 'u1',
        roles: ['manager'],
        licensedModules: ['marketing'],
        requestedCapability: 'send',
      },
    },
  ]

  for (const smoke of smokeCases) {
    const got = decide(smoke.slug, smoke.context)
    if (got !== smoke.expect) {
      fail(`smoke '${smoke.name}' expected ${smoke.expect}, got ${got}`)
    }
  }

  if (process.exitCode) {
    console.error('Customer specialist check FAILED')
    process.exit(process.exitCode)
  }

  console.log(
    `Customer specialist check PASS (${divisionKeys.length} divisions, ${slugs.size} agents, header ${agentsDoc.entitlementHeaderVersion}, ${smokeCases.length} smoke cases)`
  )
}

main()
