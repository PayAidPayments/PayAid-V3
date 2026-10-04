/**
 * LangChain-style chain wrapper — delegates to existing service, adds platform tracing.
 */

import { SentimentAnalysisService } from '@/lib/ai/sentiment-analysis'
import { handleAiIngress } from '../ingress/ingress'
import { buildPromptFromTemplate } from '../prompts/registry'
import { applyOutputGuardrails } from '../validation/output-guardrails'
import { emitAiTrace } from '../observability/trace'
import { createInteractionId, AI_TRACE_SCHEMA_VERSION } from '../observability/log-schema'
import { getWorkflow } from '../workflows/registry'

export async function runSentimentChain(params: {
  text: string
  tenantId: string
  userId: string
  route: string
  context?: { contactName?: string; dealStage?: string }
}): Promise<{ success: boolean; data?: unknown; error?: string; code?: string }> {
  const startedAt = Date.now()
  const interactionId = createInteractionId()
  const workflow = getWorkflow('sentiment.analyze')!

  const ingress = await handleAiIngress({
    raw: params.text,
    surface: 'sentiment',
    route: params.route,
    channel: 'api',
    ctx: {
      tenantId: params.tenantId,
      userId: params.userId,
      workflowId: workflow.id,
      workflowVersion: workflow.version,
    },
  })

  if (!ingress.allowed) {
    await emitAiTrace({
      schemaVersion: AI_TRACE_SCHEMA_VERSION,
      interactionId,
      timestamp: new Date().toISOString(),
      tenantId: params.tenantId,
      principal: { userId: params.userId },
      workflow: { id: workflow.id, version: workflow.version, orchestration: 'langchain' },
      ingress: {
        surface: 'sentiment',
        route: params.route,
        intent: ingress.classification.intent,
        sensitivity: ingress.classification.sensitivity,
        risk: ingress.classification.risk,
      },
      prompt: { templateId: 'sentiment.analyze', templateVersion: '1.0.0', modelProvider: 'groq' },
      policy: {
        policyVersion: ingress.policyVersion,
        decision: 'blocked',
        code: ingress.blockCode,
      },
      outcome: { status: 'blocked', latencyMs: Date.now() - startedAt, errorCode: ingress.blockCode },
    })
    return { success: false, error: ingress.blockReason, code: ingress.blockCode }
  }

  buildPromptFromTemplate({
    templateId: 'sentiment.analyze',
    userMessage: ingress.sanitizedText,
    trustedSlots: {
      contactContext: params.context
        ? `Contact: ${params.context.contactName || 'N/A'}, Stage: ${params.context.dealStage || 'N/A'}`
        : '',
    },
  })

  const service = new SentimentAnalysisService()
  const result = await service.analyzeSentiment(ingress.sanitizedText, params.context)
  const output = applyOutputGuardrails(JSON.stringify(result))

  await emitAiTrace({
    schemaVersion: AI_TRACE_SCHEMA_VERSION,
    interactionId,
    timestamp: new Date().toISOString(),
    tenantId: params.tenantId,
    principal: { userId: params.userId },
    workflow: { id: workflow.id, version: workflow.version, orchestration: 'langchain' },
    ingress: {
      surface: 'sentiment',
      route: params.route,
      intent: ingress.classification.intent,
      sensitivity: ingress.classification.sensitivity,
      risk: ingress.classification.risk,
    },
    prompt: { templateId: 'sentiment.analyze', templateVersion: '1.0.0', modelProvider: 'groq' },
    policy: { policyVersion: ingress.policyVersion, decision: 'allowed' },
    outcome: {
      status: output.allowed ? 'success' : 'blocked',
      latencyMs: Date.now() - startedAt,
      errorCode: output.allowed ? undefined : 'OUTPUT_GUARDRAIL',
    },
    securityFlags: output.flags,
  })

  if (!output.allowed) {
    return { success: false, error: 'Output failed guardrails', code: 'OUTPUT_GUARDRAIL' }
  }

  return { success: true, data: result }
}
