import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { sdrPlaybookBodySchema } from '@/lib/ai-native/m2-contracts'
import { trackEvent } from '@/lib/analytics/track'

const SDR_TRIGGER_TYPE = 'SDR_PLAYBOOK'

/**
 * GET /api/v1/sdr/playbooks — List SDR playbooks for tenant.
 * POST /api/v1/sdr/playbooks — Create a new SDR playbook.
 */

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_sdr')
    await assertAnyPermission(request, ['crm:sdr:read', 'crm:admin'])

    const playbooks = await prisma.workflow.findMany({
      where: { tenantId, triggerType: SDR_TRIGGER_TYPE },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        steps: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { executions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      playbooks: playbooks.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        is_active: p.isActive,
        steps: p.steps,
        run_count: p._count.executions,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      })),
      total: playbooks.length,
    })
  } catch (error) {
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: error.message, code: 'PERMISSION_DENIED' }, { status: 403 })
    }
    const err = handleLicenseError(error)
    if (err) return err
    console.error('List SDR playbooks error:', error)
    return NextResponse.json({ error: 'Failed to list playbooks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_sdr')
    await assertAnyPermission(request, ['crm:sdr:write', 'crm:admin'])

    const body = await request.json()
    const validated = sdrPlaybookBodySchema.parse(body)

    const playbook = await prisma.workflow.create({
      data: {
        tenantId,
        name: validated.name,
        description: validated.description,
        triggerType: SDR_TRIGGER_TYPE,
        isActive: true,
        isTemplate: false,
        steps: {
          sdr_steps: validated.steps,
          guardrails: validated.guardrails ?? {},
          schema_version: '1.0',
           
        } as any,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        steps: true,
        createdAt: true,
      },
    })

    // Product analytics
    trackEvent('sdr_playbook_created', {
      tenantId,
      userId,
      entityId: playbook.id,
      properties: { step_count: validated.steps?.length ?? 0, has_guardrails: !!(validated.guardrails && Object.keys(validated.guardrails).length) },
    })

    // Non-fatal audit trail
    prisma.auditLog.create({
      data: {
        tenantId,
        entityType: 'sdr_playbook',
        entityId: playbook.id,
        changedBy: userId ?? 'system',
        changeSummary: 'sdr_playbook_created',
        afterSnapshot: {
          name: playbook.name,
          step_count: validated.steps?.length ?? 0,
          guardrails: validated.guardrails ?? null,
           
        } as any,
      },
    })?.catch(() => { /* non-fatal */ })

    return NextResponse.json(
      {
        success: true,
        playbook: {
          id: playbook.id,
          name: playbook.name,
          description: playbook.description,
          is_active: playbook.isActive,
          steps: playbook.steps,
          created_at: playbook.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: error.message, code: 'PERMISSION_DENIED' }, { status: 403 })
    }
    const err = handleLicenseError(error)
    if (err) return err
    if (error instanceof Error && error.name === 'ZodError') {
      const ze = error as any
      return NextResponse.json({ error: 'Validation error', details: ze.errors }, { status: 400 })
    }
    // Zod parse errors from z.ZodError
    const { ZodError } = await import('zod')
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Create SDR playbook error:', error)
    return NextResponse.json({ error: 'Failed to create playbook' }, { status: 500 })
  }
}
