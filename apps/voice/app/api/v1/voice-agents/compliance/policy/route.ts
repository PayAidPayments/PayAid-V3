/**
 * GET/PUT /api/v1/voice-agents/compliance/policy
 * Tenant voice compliance policy (recording, consent, retention).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleVoiceAccessError, requireVoiceAccess } from '@/lib/voice-agent/rbac'
import {
  loadVoiceTenantCompliancePolicy,
  saveVoiceTenantCompliancePolicy,
  voiceCompliancePolicySchema,
} from '@/lib/voice-agent/consent-policy'
import { z } from 'zod'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireVoiceAccess(request, 'configure')
    const policy = await loadVoiceTenantCompliancePolicy(prisma, tenantId)
    return NextResponse.json({ ok: true, policy })
  } catch (error) {
    const denied = handleVoiceAccessError(error)
    if (denied) return denied
    console.error('[compliance/policy] GET', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to load policy' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { tenantId } = await requireVoiceAccess(request, 'configure')
    const body = voiceCompliancePolicySchema.parse(await request.json())
    const policy = await saveVoiceTenantCompliancePolicy(prisma, tenantId, body)
    return NextResponse.json({ ok: true, policy })
  } catch (error) {
    const denied = handleVoiceAccessError(error)
    if (denied) return denied
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('[compliance/policy] PUT', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to save policy' },
      { status: 500 },
    )
  }
}
