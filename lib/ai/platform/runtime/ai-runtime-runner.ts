/**
 * AiRuntimeRunner — mandatory 8-stage shared AI execution contract.
 *
 * Stages:
 * 1 Request Analysis → 2 Planning → 3 Tool Selection → 4 Execution
 * → 5 Validation → 6 Response Generation → 7 Reflection → 8 Risk Analysis
 *
 * The model may suggest actions; this runtime decides whether execution is allowed.
 */

import { handleAiIngress } from '../ingress/ingress'
import { applyOutputGuardrails } from '../validation/output-guardrails'
import { validateToolSequence } from '../validation/tool-sequence'
import { emitAiTrace } from '../observability/trace'
import { AI_TRACE_SCHEMA_VERSION, createInteractionId } from '../observability/log-schema'
import type { AiSurface, ToolCapability } from '@/lib/security/ai-policy'
import {
  evaluateToolPolicy,
  getToolDefinition,
  listClassifiedTools,
} from '@/lib/security/ai-policy/tool-inventory'
import { evaluateProposedAction } from '@/lib/security/ai-policy/typed-actions'
import { recordToolInvocation } from '@/lib/security/ai-policy/circuit-breaker'
import { scanRetrievedChunks } from '@/lib/security/ai-policy/prompt-injection-scanner'
import type { IngressClassification, RiskClass } from '../types'
import {
  AI_RUNTIME_VERSION,
  emptyReflection,
  emptyRiskAnalysis,
  type Citation,
  type ExecutionMode,
  type PlanningSection,
  type ReflectionSection,
  type RiskAnalysisSection,
  type RuntimeOutcomeMode,
  type ToolSelectionSection,
} from './schemas'
import { assessGroundedness } from '../rag/groundedness'

export interface AiRuntimeAuthContext {
  tenantId: string
  userId: string
  roles?: string[]
  sessionId?: string
  module?: string
}

export interface AiRuntimeRequest extends AiRuntimeAuthContext {
  prompt: string
  surface: AiSurface
  route: string
  channel?: 'dashboard' | 'voice' | 'email' | 'webhook' | 'api'
  retrievedChunks?: string[]
  proposedTools?: string[]
  approvalConfirmed?: boolean
  mode?: ExecutionMode
  metadata?: Record<string, unknown>
  requireGrounding?: boolean
  sensitiveQuestion?: boolean
}

export interface AiRuntimeGenerateContext {
  interactionId: string
  sanitizedPrompt: string
  classification: IngressClassification
  planning: PlanningSection
  toolSelection: ToolSelectionSection
  mode: RuntimeOutcomeMode
  policyVersion: string
  runtimeVersion: string
  retrievedChunks?: string[]
}

export interface AiRuntimeGenerateResult {
  text?: string
  data?: unknown
  citations?: Citation[]
  toolsUsed?: Array<{ toolId: string; capability?: ToolCapability; ok?: boolean }>
  modelProvider?: string
  /** D1 — registry template used for model messages */
  promptTemplateId?: string
  promptTemplateVersion?: string
}

export interface AiRuntimeResult<T = unknown> {
  allowed: boolean
  mode: RuntimeOutcomeMode
  blockCode?: string
  blockReason?: string
  interactionId: string
  sanitizedPrompt: string
  classification: IngressClassification
  planning: PlanningSection
  toolSelection: ToolSelectionSection
  validation: { ok: boolean; flags: string[] }
  reflection: ReflectionSection
  riskAnalysis: RiskAnalysisSection
  citations?: Citation[]
  policyVersion: string
  runtimeVersion: string
  result?: T
  responseText?: string
}

function elevateRisk(a: RiskClass, b: RiskClass): RiskClass {
  const order: RiskClass[] = ['low', 'medium', 'high', 'critical']
  return order[Math.max(order.indexOf(a), order.indexOf(b))] || 'high'
}

function planFromClassification(
  classification: IngressClassification,
  mode: ExecutionMode,
  approvalConfirmed: boolean
): PlanningSection {
  const steps: string[] = ['analyze_request']
  const dependencies: string[] = ['tenant_auth', 'policy_gateway']

  if (classification.actionOriented) {
    steps.push('select_tools', 'validate_permissions')
    dependencies.push('tool_inventory')
  } else if (classification.intent === 'draft_content') {
    steps.push('draft_content')
  } else if (classification.intent === 'analytical') {
    steps.push('retrieve_context', 'analyze')
  } else {
    steps.push('answer')
  }

  steps.push('validate_output', 'emit_trace')

  let recommendedMode: RuntimeOutcomeMode = 'execute'
  if (classification.risk === 'critical') {
    recommendedMode = 'refuse'
  } else if (
    classification.actionOriented ||
    classification.risk === 'high' ||
    mode === 'draft'
  ) {
    recommendedMode = approvalConfirmed && mode === 'execute' ? 'execute' : 'draft'
  } else if (mode === 'execute') {
    recommendedMode = 'execute'
  } else if (mode === 'auto') {
    recommendedMode = classification.actionOriented ? 'draft' : 'execute'
  } else {
    recommendedMode = 'draft'
  }

  return {
    steps,
    dependencies,
    risk: classification.risk,
    recommendedMode,
    actionOriented: classification.actionOriented,
  }
}

function selectTools(params: {
  proposedTools?: string[]
  tenantId: string
  userId: string
  roles?: string[]
  module?: string
  approvalConfirmed: boolean
  planning: PlanningSection
}): ToolSelectionSection {
  const requested = params.proposedTools?.length
    ? params.proposedTools
    : params.planning.actionOriented
      ? []
      : []

  const allowedTools: string[] = []
  const deniedTools: ToolSelectionSection['deniedTools'] = []
  let requiresApproval = false

  // Deny-by-default: only explicitly requested + registered tools may proceed.
  for (const toolId of requested) {
    const def = getToolDefinition(toolId)
    if (!def) {
      deniedTools.push({ toolId, code: 'TOOL_UNKNOWN', reason: `Unknown tool: ${toolId}` })
      continue
    }
    const check = evaluateToolPolicy(
      {
        tenantId: params.tenantId,
        userId: params.userId,
        roles: params.roles,
        toolId,
      },
      { approvalConfirmed: params.approvalConfirmed, module: params.module }
    )
    if (!check.allowed) {
      if (check.requiresApproval) requiresApproval = true
      deniedTools.push({
        toolId,
        code: check.code,
        reason: check.reason || 'Tool denied by policy',
      })
      continue
    }
    allowedTools.push(toolId)
    if (def.requiresApproval) requiresApproval = true
  }

  const seq = validateToolSequence(
    allowedTools.map((toolId, i) => ({ toolId, at: String(i) }))
  )
  if (!seq.allowed) {
    for (const toolId of [...allowedTools]) {
      deniedTools.push({
        toolId,
        code: seq.code,
        reason: seq.reason || 'Tool sequence denied',
      })
    }
    return {
      requestedTools: requested,
      allowedTools: [],
      deniedTools,
      requiresApproval: true,
      approvalConfirmed: params.approvalConfirmed,
    }
  }

  return {
    requestedTools: requested,
    allowedTools,
    deniedTools,
    requiresApproval,
    approvalConfirmed: params.approvalConfirmed,
  }
}

function buildRiskAnalysis(params: {
  injectionRiskScore: number
  injectionFlags: string[]
  classification: IngressClassification
  toolSelection: ToolSelectionSection
  retrievalRisk: number
  outputFlags: string[]
  planning: PlanningSection
}): RiskAnalysisSection {
  const promptInjectionRisk = params.injectionRiskScore
  const sensitiveDisclosureRisk =
    params.classification.sensitivity === 'restricted'
      ? 0.85
      : params.classification.sensitivity === 'confidential'
        ? 0.65
        : params.outputFlags.some((f) => f.startsWith('pii:'))
          ? 0.55
          : 0.15

  const toolMisuseRisk = params.toolSelection.deniedTools.length
    ? 0.7
    : params.toolSelection.requiresApproval && !params.toolSelection.approvalConfirmed
      ? 0.6
      : params.toolSelection.allowedTools.length
        ? 0.25
        : 0.1

  const workflowEscalationRisk =
    params.planning.risk === 'critical'
      ? 0.9
      : params.planning.risk === 'high'
        ? 0.7
        : params.planning.actionOriented
          ? 0.45
          : 0.15

  const retrievalPoisoningRisk = params.retrievalRisk

  const scores = [
    promptInjectionRisk,
    sensitiveDisclosureRisk,
    toolMisuseRisk,
    workflowEscalationRisk,
    retrievalPoisoningRisk,
  ]
  const max = Math.max(...scores)
  const overallRisk: RiskClass =
    max >= 0.85 ? 'critical' : max >= 0.65 ? 'high' : max >= 0.4 ? 'medium' : 'low'

  const flags = [
    ...params.injectionFlags,
    ...params.outputFlags,
    ...params.toolSelection.deniedTools.map((d) => `tool_denied:${d.toolId}`),
  ]

  return emptyRiskAnalysis({
    promptInjectionRisk,
    sensitiveDisclosureRisk,
    toolMisuseRisk,
    workflowEscalationRisk,
    retrievalPoisoningRisk,
    overallRisk,
    flags: [...new Set(flags)],
  })
}

function resolveMode(
  planning: PlanningSection,
  toolSelection: ToolSelectionSection,
  requested: ExecutionMode
): RuntimeOutcomeMode {
  if (planning.recommendedMode === 'refuse') return 'refuse'
  if (toolSelection.requiresApproval && !toolSelection.approvalConfirmed) return 'draft'
  if (requested === 'draft') return 'draft'
  if (requested === 'execute' && !toolSelection.deniedTools.length) {
    return planning.recommendedMode === 'draft' ? 'draft' : 'execute'
  }
  return planning.recommendedMode
}

/**
 * Full 8-stage runner with optional generate callback (stage 4).
 */
export async function runAiRuntime<T = AiRuntimeGenerateResult>(params: {
  request: AiRuntimeRequest
  generate?: (ctx: AiRuntimeGenerateContext) => Promise<T & Partial<AiRuntimeGenerateResult>>
}): Promise<AiRuntimeResult<T>> {
  const started = Date.now()
  const interactionId = createInteractionId()
  const req = params.request
  const approvalConfirmed = Boolean(req.approvalConfirmed)
  const requestedMode: ExecutionMode = req.mode || 'auto'

  // --- Stage 1: Request Analysis (ingress + policy gateway) ---
  const ingress = await handleAiIngress({
    raw: req.prompt,
    surface: req.surface,
    route: req.route,
    channel: req.channel || 'api',
    ctx: {
      tenantId: req.tenantId,
      userId: req.userId,
      roles: req.roles,
      sessionId: req.sessionId,
    },
    retrievedChunks: req.retrievedChunks,
    metadata: req.metadata,
  })

  if (!ingress.allowed) {
    const refused: AiRuntimeResult<T> = {
      allowed: false,
      mode: 'refuse',
      blockCode: ingress.blockCode,
      blockReason: ingress.blockReason,
      interactionId,
      sanitizedPrompt: ingress.sanitizedText,
      classification: ingress.classification,
      planning: planFromClassification(ingress.classification, requestedMode, approvalConfirmed),
      toolSelection: {
        requestedTools: req.proposedTools || [],
        allowedTools: [],
        deniedTools: [],
        requiresApproval: false,
        approvalConfirmed,
      },
      validation: { ok: false, flags: ['ingress_blocked'] },
      reflection: emptyReflection({ selfCheckPassed: false, missingEvidence: ['ingress_blocked'] }),
      riskAnalysis: emptyRiskAnalysis({
        promptInjectionRisk: 1,
        overallRisk: 'critical',
        flags: ['ingress_blocked'],
      }),
      policyVersion: ingress.policyVersion,
      runtimeVersion: AI_RUNTIME_VERSION,
    }
    await emitRuntimeTrace(refused, req, started, 'blocked')
    return refused
  }

  // --- Stage 2: Planning ---
  const planning = planFromClassification(ingress.classification, requestedMode, approvalConfirmed)

  // --- Stage 3: Tool Selection ---
  const toolSelection = selectTools({
    proposedTools: req.proposedTools,
    tenantId: req.tenantId,
    userId: req.userId,
    roles: req.roles,
    module: req.module,
    approvalConfirmed,
    planning,
  })

  const mode = resolveMode(planning, toolSelection, requestedMode)
  if (mode === 'refuse') {
    const refused: AiRuntimeResult<T> = {
      allowed: false,
      mode: 'refuse',
      blockCode: 'AI_RUNTIME_REFUSED',
      blockReason: 'Request classified as too risky for execution',
      interactionId,
      sanitizedPrompt: ingress.sanitizedText,
      classification: ingress.classification,
      planning,
      toolSelection,
      validation: { ok: false, flags: ['planning_refuse'] },
      reflection: emptyReflection({ selfCheckPassed: false }),
      riskAnalysis: emptyRiskAnalysis({
        workflowEscalationRisk: 0.9,
        overallRisk: 'critical',
        flags: ['planning_refuse'],
      }),
      policyVersion: ingress.policyVersion,
      runtimeVersion: AI_RUNTIME_VERSION,
    }
    await emitRuntimeTrace(refused, req, started, 'blocked')
    return refused
  }

  // High-impact tools without approval → allow draft path only (caller must not execute).
  if (
    toolSelection.requiresApproval &&
    !approvalConfirmed &&
    requestedMode === 'execute' &&
    toolSelection.requestedTools.length > 0
  ) {
    const blocked: AiRuntimeResult<T> = {
      allowed: false,
      mode: 'draft',
      blockCode: 'AI_APPROVAL_REQUIRED',
      blockReason: 'High-risk tool execution requires human approval',
      interactionId,
      sanitizedPrompt: ingress.sanitizedText,
      classification: ingress.classification,
      planning,
      toolSelection,
      validation: { ok: false, flags: ['approval_required'] },
      reflection: emptyReflection({
        selfCheckPassed: true,
        groundingNotes: ['Side effects held as draft pending approval'],
      }),
      riskAnalysis: emptyRiskAnalysis({
        toolMisuseRisk: 0.7,
        overallRisk: 'high',
        flags: ['approval_required'],
      }),
      policyVersion: ingress.policyVersion,
      runtimeVersion: AI_RUNTIME_VERSION,
    }
    await emitRuntimeTrace(blocked, req, started, 'approval_required')
    return blocked
  }

  const generateCtx: AiRuntimeGenerateContext = {
    interactionId,
    sanitizedPrompt: ingress.sanitizedText,
    classification: ingress.classification,
    planning,
    toolSelection,
    mode,
    policyVersion: ingress.policyVersion,
    runtimeVersion: AI_RUNTIME_VERSION,
    retrievedChunks: req.retrievedChunks,
  }

  // --- Stage 4: Execution (handler / model) ---
  let generated: (T & Partial<AiRuntimeGenerateResult>) | undefined
  if (params.generate) {
    for (const toolId of toolSelection.allowedTools) {
      recordToolInvocation(req.tenantId)
      const def = getToolDefinition(toolId)
      if (def && mode === 'execute') {
        const actionCheck = evaluateProposedAction({
          tenantId: req.tenantId,
          userId: req.userId,
          roles: req.roles,
          module: req.module,
          approvalConfirmed,
          action: { type: toolId, capability: def.capability },
        })
        if (!actionCheck.allowed) {
          toolSelection.deniedTools.push({
            toolId,
            code: actionCheck.code,
            reason: actionCheck.reason || 'Action denied',
          })
          toolSelection.allowedTools = toolSelection.allowedTools.filter((t) => t !== toolId)
        }
      }
    }
    generated = await params.generate(generateCtx)
  }

  const responseText =
    generated && typeof generated === 'object' && 'text' in generated && typeof generated.text === 'string'
      ? generated.text
      : undefined

  // --- Stage 5: Validation ---
  const validationFlags: string[] = []
  let validationOk = true
  let sanitizedOutput = responseText || ''

  if (responseText) {
    const guard = applyOutputGuardrails(responseText)
    sanitizedOutput = guard.sanitizedOutput
    validationFlags.push(...guard.flags)
    if (!guard.allowed) {
      validationOk = false
    }
  }

  // --- Stage 6–7: Response + Reflection (groundedness) ---
  const citations = generated?.citations
  const groundedness = assessGroundedness({
    answerText: sanitizedOutput,
    retrievedChunks: req.retrievedChunks,
    citations,
    requireGrounding: req.requireGrounding,
    sensitiveQuestion: req.sensitiveQuestion || ingress.classification.sensitivity !== 'public',
  })

  if (!groundedness.allowed) {
    validationOk = false
    validationFlags.push(...groundedness.flags)
  }

  const reflection = emptyReflection({
    grounded: groundedness.grounded,
    confidence: groundedness.confidence,
    groundingNotes: groundedness.notes,
    missingEvidence: groundedness.missingEvidence,
    selfCheckPassed: validationOk && groundedness.grounded !== false,
  })

  // --- Stage 8: Risk Analysis ---
  let retrievalRisk = 0
  if (req.retrievedChunks?.length) {
    retrievalRisk = scanRetrievedChunks(req.retrievedChunks).riskScore
  }

  const riskAnalysis = buildRiskAnalysis({
    injectionRiskScore: Math.max(
      ingress.classification.labels.includes('injection_hint') ? 0.7 : 0,
      retrievalRisk
    ),
    injectionFlags: ingress.classification.labels.filter((l) => l.includes('injection')),
    classification: ingress.classification,
    toolSelection,
    retrievalRisk,
    outputFlags: validationFlags,
    planning,
  })

  const overall: RiskClass = elevateRisk(planning.risk, riskAnalysis.overallRisk)
  riskAnalysis.overallRisk = overall

  if (!validationOk && req.requireGrounding) {
    const refused: AiRuntimeResult<T> = {
      allowed: false,
      mode: 'refuse',
      blockCode: 'AI_GROUNDING_FAILED',
      blockReason: 'Answer failed grounding / validation requirements',
      interactionId,
      sanitizedPrompt: ingress.sanitizedText,
      classification: ingress.classification,
      planning,
      toolSelection,
      validation: { ok: false, flags: validationFlags },
      reflection,
      riskAnalysis,
      citations,
      policyVersion: ingress.policyVersion,
      runtimeVersion: AI_RUNTIME_VERSION,
      result: generated as T | undefined,
      responseText: sanitizedOutput,
    }
    attachPromptTemplateMeta(req, generated)
    await emitRuntimeTrace(refused, req, started, 'blocked', generated?.modelProvider)
    return refused
  }

  const success: AiRuntimeResult<T> = {
    allowed: true,
    mode,
    interactionId,
    sanitizedPrompt: ingress.sanitizedText,
    classification: ingress.classification,
    planning,
    toolSelection,
    validation: { ok: validationOk, flags: validationFlags },
    reflection,
    riskAnalysis,
    citations,
    policyVersion: ingress.policyVersion,
    runtimeVersion: AI_RUNTIME_VERSION,
    result: generated as T | undefined,
    responseText: sanitizedOutput || undefined,
  }

  attachPromptTemplateMeta(req, generated)
  await emitRuntimeTrace(success, req, started, 'success', generated?.modelProvider)
  return success
}

/**
 * Pre-model gate only (stages 1–3 + mode). Does not emit success traces.
 * Use with finalizeAiRuntime / runAiRuntime({ generate }) after the model call.
 */
export async function prepareAiRuntime(
  request: AiRuntimeRequest
): Promise<AiRuntimeResult & { generateContext?: AiRuntimeGenerateContext }> {
  const started = Date.now()
  const interactionId = createInteractionId()
  const approvalConfirmed = Boolean(request.approvalConfirmed)
  const requestedMode: ExecutionMode = request.mode || 'auto'

  const ingress = await handleAiIngress({
    raw: request.prompt,
    surface: request.surface,
    route: request.route,
    channel: request.channel || 'api',
    ctx: {
      tenantId: request.tenantId,
      userId: request.userId,
      roles: request.roles,
      sessionId: request.sessionId,
    },
    retrievedChunks: request.retrievedChunks,
    metadata: request.metadata,
  })

  const planning = planFromClassification(ingress.classification, requestedMode, approvalConfirmed)
  const toolSelection = selectTools({
    proposedTools: request.proposedTools,
    tenantId: request.tenantId,
    userId: request.userId,
    roles: request.roles,
    module: request.module,
    approvalConfirmed,
    planning,
  })

  if (!ingress.allowed) {
    const refused: AiRuntimeResult = {
      allowed: false,
      mode: 'refuse',
      blockCode: ingress.blockCode,
      blockReason: ingress.blockReason,
      interactionId,
      sanitizedPrompt: ingress.sanitizedText,
      classification: ingress.classification,
      planning,
      toolSelection,
      validation: { ok: false, flags: ['ingress_blocked'] },
      reflection: emptyReflection({ selfCheckPassed: false }),
      riskAnalysis: emptyRiskAnalysis({
        promptInjectionRisk: 1,
        overallRisk: 'critical',
        flags: ['ingress_blocked'],
      }),
      policyVersion: ingress.policyVersion,
      runtimeVersion: AI_RUNTIME_VERSION,
    }
    await emitRuntimeTrace(refused, request, started, 'blocked')
    return refused
  }

  const mode = resolveMode(planning, toolSelection, requestedMode)
  if (mode === 'refuse') {
    const refused: AiRuntimeResult = {
      allowed: false,
      mode: 'refuse',
      blockCode: 'AI_RUNTIME_REFUSED',
      blockReason: 'Request classified as too risky for execution',
      interactionId,
      sanitizedPrompt: ingress.sanitizedText,
      classification: ingress.classification,
      planning,
      toolSelection,
      validation: { ok: false, flags: ['planning_refuse'] },
      reflection: emptyReflection({ selfCheckPassed: false }),
      riskAnalysis: emptyRiskAnalysis({
        workflowEscalationRisk: 0.9,
        overallRisk: 'critical',
        flags: ['planning_refuse'],
      }),
      policyVersion: ingress.policyVersion,
      runtimeVersion: AI_RUNTIME_VERSION,
    }
    await emitRuntimeTrace(refused, request, started, 'blocked')
    return refused
  }

  if (
    toolSelection.requiresApproval &&
    !approvalConfirmed &&
    requestedMode === 'execute' &&
    toolSelection.requestedTools.length > 0
  ) {
    const blocked: AiRuntimeResult = {
      allowed: false,
      mode: 'draft',
      blockCode: 'AI_APPROVAL_REQUIRED',
      blockReason: 'High-risk tool execution requires human approval',
      interactionId,
      sanitizedPrompt: ingress.sanitizedText,
      classification: ingress.classification,
      planning,
      toolSelection,
      validation: { ok: false, flags: ['approval_required'] },
      reflection: emptyReflection({
        selfCheckPassed: true,
        groundingNotes: ['Side effects held as draft pending approval'],
      }),
      riskAnalysis: emptyRiskAnalysis({
        toolMisuseRisk: 0.7,
        overallRisk: 'high',
        flags: ['approval_required'],
      }),
      policyVersion: ingress.policyVersion,
      runtimeVersion: AI_RUNTIME_VERSION,
    }
    await emitRuntimeTrace(blocked, request, started, 'approval_required')
    return blocked
  }

  return {
    allowed: true,
    mode,
    interactionId,
    sanitizedPrompt: ingress.sanitizedText,
    classification: ingress.classification,
    planning,
    toolSelection,
    validation: { ok: true, flags: [] },
    reflection: emptyReflection({ selfCheckPassed: true, confidence: 'medium' }),
    riskAnalysis: emptyRiskAnalysis({ overallRisk: planning.risk }),
    policyVersion: ingress.policyVersion,
    runtimeVersion: AI_RUNTIME_VERSION,
    generateContext: {
      interactionId,
      sanitizedPrompt: ingress.sanitizedText,
      classification: ingress.classification,
      planning,
      toolSelection,
      mode,
      policyVersion: ingress.policyVersion,
      runtimeVersion: AI_RUNTIME_VERSION,
      retrievedChunks: request.retrievedChunks,
    },
  }
}

export async function finalizeAiRuntime(params: {
  request: AiRuntimeRequest
  text?: string
  citations?: Citation[]
  toolsUsed?: Array<{ toolId: string; capability?: ToolCapability; ok?: boolean }>
  modelProvider?: string
  data?: unknown
}): Promise<AiRuntimeResult> {
  return runAiRuntime({
    request: params.request,
    generate: async () => ({
      text: params.text,
      citations: params.citations,
      toolsUsed: params.toolsUsed,
      modelProvider: params.modelProvider,
      data: params.data,
    }),
  })
}

async function emitRuntimeTrace<T>(
  result: AiRuntimeResult<T>,
  req: AiRuntimeRequest,
  started: number,
  decision: 'success' | 'blocked' | 'approval_required',
  modelProvider?: string
): Promise<void> {
  await emitAiTrace({
    schemaVersion: AI_TRACE_SCHEMA_VERSION,
    interactionId: result.interactionId,
    timestamp: new Date().toISOString(),
    tenantId: req.tenantId,
    principal: { userId: req.userId, roles: req.roles },
    workflow: {
      id: `runtime:${req.surface}`,
      version: AI_RUNTIME_VERSION,
      orchestration: 'custom',
    },
    ingress: {
      surface: req.surface,
      route: req.route,
      intent: result.classification.intent,
      sensitivity: result.classification.sensitivity,
      risk: result.classification.risk,
    },
    prompt: {
      modelProvider,
      templateId:
        typeof req.metadata?.promptTemplateId === 'string'
          ? req.metadata.promptTemplateId
          : undefined,
      templateVersion:
        typeof req.metadata?.promptTemplateVersion === 'string'
          ? req.metadata.promptTemplateVersion
          : undefined,
    },
    policy: {
      policyVersion: result.policyVersion,
      decision: decision === 'success' ? 'allowed' : decision === 'approval_required' ? 'approval_required' : 'blocked',
      code: result.blockCode,
      injectionRiskScore: result.riskAnalysis.promptInjectionRisk,
      injectionFlags: result.riskAnalysis.flags,
    },
    tools: result.toolSelection.allowedTools.map((toolId) => ({
      toolId,
      capability: getToolDefinition(toolId)?.capability || 'read',
      result: decision === 'success' ? 'success' : 'blocked',
    })),
    approval: {
      required: result.toolSelection.requiresApproval,
      confirmed: result.toolSelection.approvalConfirmed,
    },
    outcome: {
      status: decision === 'success' ? 'success' : 'blocked',
      latencyMs: Date.now() - started,
      errorCode: result.blockCode,
    },
    securityFlags: result.riskAnalysis.flags,
  })
}

function attachPromptTemplateMeta(
  req: AiRuntimeRequest,
  generated?: AiRuntimeGenerateResult | null
): void {
  if (!generated?.promptTemplateId) return
  req.metadata = {
    ...(req.metadata || {}),
    promptTemplateId: generated.promptTemplateId,
    promptTemplateVersion: generated.promptTemplateVersion,
  }
}

/** Inventory helper for operators / CI diagnostics */
export function listRuntimeRegisteredTools() {
  return listClassifiedTools()
}
