/**
 * wrapAiRoute — mandatory wrapper for /api/ai HTTP handlers.
 *
 * Enforces: auth/tenant, policy metadata, AiRuntimeRunner, standardized errors.
 * Coverage scripts detect `wrapAiRoute(` as fully migrated.
 *
 * BD-06: when `bodySchema` is provided, handler `body` is inferred from Zod output
 * (`AiRoutePolicyMeta<TBody>` + overload), so callers stop seeing `unknown` fields.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  requireModuleAccess,
  requireAnyModuleAccess,
  handleLicenseError,
} from '@/lib/middleware/license'
import type { AiSurface } from '@/lib/security/ai-policy'
import {
  prepareAiRuntime,
  runAiRuntime,
  type AiRuntimeGenerateContext,
  type AiRuntimeGenerateResult,
  type AiRuntimeRequest,
  type AiRuntimeResult,
} from '@/lib/ai/platform/runtime/ai-runtime-runner'
import type { ExecutionMode } from '@/lib/ai/platform/runtime/schemas'
import { AI_RUNTIME_VERSION } from '@/lib/ai/platform/runtime/schemas'
import { asRecord, asString } from '@/lib/ai/json-narrow'

/** Exported marker shape — also used by coverage scanners */
export type AiRoutePolicyMeta<TBody = Record<string, unknown>> = {
  surface: AiSurface
  /** Canonical route path, e.g. /api/ai/chat */
  route: string
  /** Module license gate (primary). Prefer moduleIds when dual-license. */
  moduleId: string
  /** Optional multi-module gate (first licensed match wins). */
  moduleIds?: string[]
  /** Body field(s) used as prompt for policy scanning */
  promptFrom?: (body: TBody) => string
  sessionIdFrom?: (body: TBody) => string | undefined
  modeFrom?: (body: TBody) => ExecutionMode | undefined
  toolsFrom?: (body: TBody) => string[] | undefined
  approvalFrom?: (body: TBody) => boolean | undefined
  retrievedChunksFrom?: (body: TBody) => string[] | undefined
  requireGrounding?: boolean
  sensitiveQuestion?: boolean | ((body: TBody) => boolean)
  channel?: AiRuntimeRequest['channel']
  /** When set, handler `body` is inferred as Zod output of this schema. */
  bodySchema?: z.ZodType<TBody>
  /** Allow empty prompt (e.g. imageUrl-only video jobs) */
  allowEmptyPrompt?: boolean
}

export type WrappedAiHandlerContext<TBody = Record<string, unknown>> = {
  request: NextRequest
  body: TBody
  auth: {
    tenantId: string
    userId: string
    roles: string[]
    permissions: string[]
    licensedModules: string[]
  }
  runtime: AiRuntimeGenerateContext
  prepared: AiRuntimeResult
  /** Call after model generation to run validation/reflection/risk stages */
  finalize: (output: AiRuntimeGenerateResult) => Promise<AiRuntimeResult>
}

export type WrapAiRouteHandler<TBody = Record<string, unknown>> = (
  ctx: WrappedAiHandlerContext<TBody>
) => Promise<NextResponse | Response>

function defaultPromptFrom(body: Record<string, unknown>): string {
  const candidates = ['message', 'query', 'prompt', 'text', 'input']
  for (const key of candidates) {
    const val = asString(body[key])
    if (val.trim()) return val
  }
  return JSON.stringify(body).slice(0, 2000)
}

function policyDenialResponse(prepared: AiRuntimeResult): NextResponse {
  const status = prepared.blockCode === 'AI_RATE_LIMITED' ? 429 : 403
  return NextResponse.json(
    {
      error: prepared.blockReason || 'AI policy denied this request',
      code: prepared.blockCode || 'AI_POLICY_DENIED',
      policyVersion: prepared.policyVersion,
      runtimeVersion: prepared.runtimeVersion,
      interactionId: prepared.interactionId,
      mode: prepared.mode,
      riskAnalysis: prepared.riskAnalysis,
    },
    { status }
  )
}

type WrapAiRouteMetaWithSchema<TSchema extends z.ZodType> = Omit<
  AiRoutePolicyMeta<z.output<TSchema>>,
  'bodySchema'
> & {
  bodySchema: TSchema
}

/**
 * Wrap a POST (or other) AI route handler with mandatory runtime enforcement.
 *
 * Prefer the schema overload so `body` is Zod-inferred rather than `unknown`.
 */
export function wrapAiRoute<TSchema extends z.ZodType>(
  meta: WrapAiRouteMetaWithSchema<TSchema>,
  handler: WrapAiRouteHandler<z.output<TSchema>>
): (request: NextRequest) => Promise<NextResponse>
export function wrapAiRoute(
  meta: AiRoutePolicyMeta,
  handler: WrapAiRouteHandler
): (request: NextRequest) => Promise<NextResponse>
export function wrapAiRoute(
  meta: AiRoutePolicyMeta,
  handler: WrapAiRouteHandler
): (request: NextRequest) => Promise<NextResponse> {
  if (!meta?.surface || !meta?.route || !meta?.moduleId) {
    throw new Error('wrapAiRoute requires surface, route, and moduleId policy metadata')
  }

  return async function wrappedAiRoute(request: NextRequest): Promise<NextResponse> {
    try {
      const access =
        meta.moduleIds && meta.moduleIds.length > 0
          ? await requireAnyModuleAccess(request, meta.moduleIds)
          : await requireModuleAccess(request, meta.moduleId)
      let body: Record<string, unknown> = {}

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        const raw = await request.json().catch(() => ({}))
        if (meta.bodySchema) {
          body = asRecord(meta.bodySchema.parse(raw))
        } else {
          body = asRecord(raw)
        }
      }

      const prompt = meta.promptFrom
        ? meta.promptFrom(body)
        : defaultPromptFrom(body)
      if (!prompt?.trim() && !meta.allowEmptyPrompt) {
        return NextResponse.json(
          { error: 'Prompt is required', code: 'AI_PROMPT_REQUIRED', runtimeVersion: AI_RUNTIME_VERSION },
          { status: 400 }
        )
      }

      const sensitive =
        typeof meta.sensitiveQuestion === 'function'
          ? meta.sensitiveQuestion(body)
          : Boolean(meta.sensitiveQuestion)

      const runtimeRequest: AiRuntimeRequest = {
        prompt: prompt?.trim() || '[empty]',
        surface: meta.surface,
        route: meta.route,
        channel: meta.channel || 'api',
        tenantId: access.tenantId,
        userId: access.userId,
        roles: access.roles,
        sessionId: meta.sessionIdFrom?.(body),
        module: meta.moduleId,
        proposedTools: meta.toolsFrom?.(body),
        approvalConfirmed: meta.approvalFrom?.(body),
        mode: meta.modeFrom?.(body) || 'auto',
        requireGrounding: meta.requireGrounding,
        sensitiveQuestion: sensitive,
        retrievedChunks: meta.retrievedChunksFrom?.(body),
      }

      const prepared = await prepareAiRuntime(runtimeRequest)

      if (!prepared.allowed || prepared.mode === 'refuse' || !prepared.generateContext) {
        return policyDenialResponse(prepared)
      }

      const runtime: AiRuntimeGenerateContext = prepared.generateContext

      const finalize = async (output: AiRuntimeGenerateResult) =>
        runAiRuntime({
          request: runtimeRequest,
          generate: async () => output,
        })

      const response = await handler({
        request,
        body,
        auth: {
          tenantId: access.tenantId,
          userId: access.userId,
          roles: access.roles || [],
          permissions: access.permissions || [],
          licensedModules: access.licensedModules || [],
        },
        runtime,
        prepared,
        finalize,
      })

      if (response instanceof NextResponse) return response
      return response as NextResponse
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors, code: 'AI_VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      if (error && typeof error === 'object' && 'moduleId' in error) {
        return handleLicenseError(error)
      }
      console.error(`[wrapAiRoute ${meta.route}]`, error)
      return NextResponse.json(
        {
          error: 'AI route failed',
          code: 'AI_ROUTE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          runtimeVersion: AI_RUNTIME_VERSION,
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Legacy compliance marker for routes not yet on wrapAiRoute.
 * Coverage script accepts this ONLY when paired with runAiRuntime or enforceAiPolicyGateway.
 */
export function declareAiRoutePolicy(meta: AiRoutePolicyMeta): AiRoutePolicyMeta {
  if (!meta?.surface || !meta?.route || !meta?.moduleId) {
    throw new Error('declareAiRoutePolicy requires surface, route, and moduleId')
  }
  return meta
}
