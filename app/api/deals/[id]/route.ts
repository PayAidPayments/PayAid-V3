import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateDealSchema = z.object({
  name: z.string().min(1).optional(),
  value: z.number().positive().optional(),
  probability: z.number().min(0).max(100).optional(),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  expectedCloseDate: z.string().datetime().optional(),
  actualCloseDate: z.string().datetime().optional(),
  lostReason: z.string().optional(),
  wonReason: z.string().optional(),
  competitor: z.string().optional(),
})

// Resolve effective tenantId: use request tenant when user has access (matches list API behavior)
async function resolveDealTenantId(
  request: NextRequest,
  jwtTenantId: string,
  userId: string
): Promise<string> {
  const requestTenantId = request.nextUrl.searchParams.get('tenantId') || undefined
  if (!requestTenantId) return jwtTenantId
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true, email: true },
  }).catch(() => null)
  const userTenantId = user?.tenantId ?? null
  const hasAccess = jwtTenantId === requestTenantId || userTenantId === requestTenantId
  const isDemoTenantRequest =
    user?.email === 'admin@demo.com' &&
    (await prisma.tenant.findUnique({
      where: { id: requestTenantId },
      select: { name: true },
    }).then((t) => t?.name?.toLowerCase().includes('demo') ?? false).catch(() => false))
  if (hasAccess || isDemoTenantRequest) return requestTenantId
  return jwtTenantId
}

// GET /api/deals/[id] - Get a single deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveDealTenantId(request, jwtTenantId, userId)

    let deal = await prisma.deal.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
      include: {
        contact: true,
      },
    })

    // Fallback: find by id only (e.g. URL tenant matches record's tenant but JWT differed)
    if (!deal) {
      const byId = await prisma.deal.findUnique({
        where: { id: resolvedParams.id },
        include: { contact: true },
      })
      if (byId) {
        const allowed =
          byId.tenantId === jwtTenantId ||
          (await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } }).then((u) => u?.tenantId === byId.tenantId))
        if (allowed) deal = byId
      }
    }

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(deal)
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get deal error:', error)
    return NextResponse.json(
      { error: 'Failed to get deal' },
      { status: 500 }
    )
  }
}

// PATCH /api/deals/[id] - Update a deal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveDealTenantId(request, jwtTenantId, userId)

    const body = await request.json()
    const validated = updateDealSchema.parse(body)

    const existing = await prisma.deal.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (validated.name) updateData.name = validated.name
    if (validated.value !== undefined) updateData.value = validated.value
    if (validated.probability !== undefined) updateData.probability = validated.probability
    if (validated.stage) updateData.stage = validated.stage
    if (validated.expectedCloseDate) {
      updateData.expectedCloseDate = new Date(validated.expectedCloseDate)
    }
    if (validated.actualCloseDate) {
      updateData.actualCloseDate = new Date(validated.actualCloseDate)
    }
    if (validated.lostReason !== undefined) updateData.lostReason = validated.lostReason
    if (validated.wonReason !== undefined) updateData.wonReason = validated.wonReason
    if (validated.competitor !== undefined) updateData.competitor = validated.competitor

    const deal = await prisma.deal.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            stage: true,
          },
        },
      },
    })

    // Auto-promote Contact to "customer" when Deal is won
    if (validated.stage === 'won' && deal.contactId && deal.contact) {
      await prisma.contact.update({
        where: { id: deal.contactId },
        data: {
          stage: 'customer', // Promote to customer
          type: 'customer', // Also update type for backward compat
        },
      })
    }

    return NextResponse.json(deal)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update deal error:', error)
    return NextResponse.json(
      { error: 'Failed to update deal' },
      { status: 500 }
    )
  }
}

// DELETE /api/deals/[id] - Delete a deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveDealTenantId(request, jwtTenantId, userId)

    const existing = await prisma.deal.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }

    await prisma.deal.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete deal error:', error)
    return NextResponse.json(
      { error: 'Failed to delete deal' },
      { status: 500 }
    )
  }
}

