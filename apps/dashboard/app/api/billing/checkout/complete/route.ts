import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const checkoutCompleteSchema = z.object({
  orderId: z.string().optional(),
  selectedModules: z.array(z.string()).optional(),
  tier: z.string().optional(),
})

/**
 * POST /api/billing/checkout/complete
 * Converts tenant modules from active_trial -> active_paid and unlocks workspace.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = auth.tenantId || auth.tenant_id || ''
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant id' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const validated = checkoutCompleteSchema.parse(body)
    const now = new Date()

    const modulesFromRequest = Array.from(new Set((validated.selectedModules || []).filter(Boolean)))

    // Optional order verification for tenant ownership
    if (validated.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: validated.orderId },
        select: { id: true, tenantId: true, status: true, total: true },
      })
      if (!order || order.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      // Mark order as confirmed/paid if still pending
      if (order.status === 'pending') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'confirmed', paidAt: now },
        })
      }
    }

    await prisma.$transaction(async (tx) => {
      // Resolve final module set:
      // 1) selectedModules from checkout payload
      // 2) otherwise currently active ModuleLicense rows
      // 3) fallback to licensedModules
      const currentTenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: {
          licensedModules: true,
          subscriptionTier: true,
          moduleLicenses: {
            where: { isActive: true },
            select: { moduleId: true },
          },
        },
      })
      if (!currentTenant) throw new Error('Tenant not found')

      let finalModules = modulesFromRequest
      if (finalModules.length === 0) {
        const fromLicenses = currentTenant.moduleLicenses.map((m) => m.moduleId)
        finalModules =
          fromLicenses.length > 0 ? fromLicenses : (currentTenant.licensedModules || [])
      }
      finalModules = Array.from(new Set(finalModules))

      await tx.moduleLicense.updateMany({
        where: {
          tenantId,
          moduleId: { notIn: finalModules },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      })

      for (const moduleId of finalModules) {
        await tx.moduleLicense.upsert({
          where: {
            tenantId_moduleId: {
              tenantId,
              moduleId,
            },
          },
          create: {
            tenantId,
            moduleId,
            isActive: true,
            activatedAt: now,
            expiresAt: null,
          },
          update: {
            isActive: true,
            activatedAt: now,
            expiresAt: null,
          },
        })
      }

      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          licensedModules: finalModules,
          billingStatus: 'active',
          subscriptionTier: validated.tier || currentTenant.subscriptionTier || 'professional',
          plan: validated.tier || 'professional',
          status: 'active',
        },
      })

      // Ensure subscription row exists / updated.
      await tx.subscription.upsert({
        where: { tenantId },
        create: {
          tenantId,
          modules: finalModules,
          tier: validated.tier || 'professional',
          monthlyPrice: 0,
          billingCycleStart: now,
          billingCycleEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          status: 'active',
        },
        update: {
          modules: finalModules,
          tier: validated.tier || 'professional',
          status: 'active',
          billingCycleStart: now,
          billingCycleEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Checkout completed. Trial modules converted to paid modules.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Checkout complete error:', error)
    return NextResponse.json(
      { error: 'Failed to complete checkout' },
      { status: 500 }
    )
  }
}

