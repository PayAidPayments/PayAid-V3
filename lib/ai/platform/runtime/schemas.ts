/**
 * Shared AI runtime schemas — request, planning, reflection, risk analysis.
 * Used by AiRuntimeRunner and wrapAiRoute.
 */

import { z } from 'zod'
import type { IntentClass, RiskClass, SensitivityClass } from '../types'

export const AI_RUNTIME_VERSION = '2026-07-21-b'

export const ExecutionModeSchema = z.enum(['draft', 'execute', 'auto'])
export type ExecutionMode = z.infer<typeof ExecutionModeSchema>

export const RuntimeOutcomeModeSchema = z.enum(['draft', 'execute', 'refuse'])
export type RuntimeOutcomeMode = z.infer<typeof RuntimeOutcomeModeSchema>

export const ReflectionSectionSchema = z.object({
  grounded: z.boolean(),
  confidence: z.enum(['low', 'medium', 'high']),
  groundingNotes: z.array(z.string()).default([]),
  missingEvidence: z.array(z.string()).default([]),
  selfCheckPassed: z.boolean(),
})
export type ReflectionSection = z.infer<typeof ReflectionSectionSchema>

export const RiskAnalysisSectionSchema = z.object({
  promptInjectionRisk: z.number().min(0).max(1),
  sensitiveDisclosureRisk: z.number().min(0).max(1),
  toolMisuseRisk: z.number().min(0).max(1),
  workflowEscalationRisk: z.number().min(0).max(1),
  retrievalPoisoningRisk: z.number().min(0).max(1),
  overallRisk: z.enum(['low', 'medium', 'high', 'critical']),
  flags: z.array(z.string()).default([]),
})
export type RiskAnalysisSection = z.infer<typeof RiskAnalysisSectionSchema>

export const PlanningSectionSchema = z.object({
  steps: z.array(z.string()),
  dependencies: z.array(z.string()).default([]),
  risk: z.enum(['low', 'medium', 'high', 'critical']),
  recommendedMode: RuntimeOutcomeModeSchema,
  actionOriented: z.boolean(),
})
export type PlanningSection = z.infer<typeof PlanningSectionSchema>

export const ToolSelectionSectionSchema = z.object({
  requestedTools: z.array(z.string()).default([]),
  allowedTools: z.array(z.string()).default([]),
  deniedTools: z
    .array(
      z.object({
        toolId: z.string(),
        code: z.string().optional(),
        reason: z.string(),
      })
    )
    .default([]),
  requiresApproval: z.boolean(),
  approvalConfirmed: z.boolean(),
})
export type ToolSelectionSection = z.infer<typeof ToolSelectionSectionSchema>

export const CitationSchema = z.object({
  sourceId: z.string().optional(),
  title: z.string().optional(),
  trustLevel: z.enum(['trusted', 'internal', 'unverified', 'denied']).optional(),
  excerpt: z.string().optional(),
})
export type Citation = z.infer<typeof CitationSchema>

export const AiRuntimeResponseExtrasSchema = z.object({
  reflection: ReflectionSectionSchema,
  riskAnalysis: RiskAnalysisSectionSchema,
  citations: z.array(CitationSchema).optional(),
  mode: RuntimeOutcomeModeSchema,
  interactionId: z.string(),
  runtimeVersion: z.string(),
  policyVersion: z.string(),
})
export type AiRuntimeResponseExtras = z.infer<typeof AiRuntimeResponseExtrasSchema>

export function emptyReflection(overrides?: Partial<ReflectionSection>): ReflectionSection {
  return ReflectionSectionSchema.parse({
    grounded: false,
    confidence: 'low',
    groundingNotes: [],
    missingEvidence: [],
    selfCheckPassed: false,
    ...overrides,
  })
}

export function emptyRiskAnalysis(overrides?: Partial<RiskAnalysisSection>): RiskAnalysisSection {
  return RiskAnalysisSectionSchema.parse({
    promptInjectionRisk: 0,
    sensitiveDisclosureRisk: 0,
    toolMisuseRisk: 0,
    workflowEscalationRisk: 0,
    retrievalPoisoningRisk: 0,
    overallRisk: 'low',
    flags: [],
    ...overrides,
  })
}

export type ClassificationLike = {
  intent: IntentClass
  sensitivity: SensitivityClass
  risk: RiskClass
  actionOriented: boolean
  labels: string[]
}
