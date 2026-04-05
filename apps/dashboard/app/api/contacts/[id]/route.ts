import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { cache } from '@/lib/redis/client'

// Resolve effective tenantId from request (matches deals list/detail behavior)
async function resolveContactTenantId(
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

// Allow empty string for optional fields from forms
const optionalEmail = z.union([z.string().email(), z.literal('')]).optional().transform((v) => (v === '' ? undefined : v))
const optionalString = z.string().optional().transform((v) => (v === '' ? undefined : v))

const updateContactSchema = z.object({
  name: z.string().min(1).optional(),
  email: optionalEmail,
  phone: optionalString,
  company: optionalString,
  type: z.enum(['customer', 'lead', 'vendor', 'employee']).optional(),
  stage: z.enum(['prospect', 'contact', 'customer']).optional(),
  status: z.enum(['active', 'inactive', 'lost']).optional(),
  source: optionalString,
  address: optionalString,
  city: optionalString,
  state: optionalString,
  postalCode: optionalString,
  country: optionalString,
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().transform((v) => (v === '' ? undefined : v)),
  likelyToBuy: z.boolean().optional(),
  churnRisk: z.boolean().optional(),
})

// GET /api/contacts/[id] - Get a single contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Handle Next.js 16+ async params
    const resolvedParams = await params
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveContactTenantId(request, jwtTenantId, userId)

    let contact = await prisma.contact.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
      include: {
        assignedTo: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        deals: {
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          where: { status: { not: 'completed' } },
          orderBy: { dueDate: 'asc' },
        },
      },
    })

    // Fallback: find by id only when tenant filter missed (e.g. URL tenant vs JWT tenant)
    if (!contact) {
      const byId = await prisma.contact.findUnique({
        where: { id: resolvedParams.id },
        include: {
          assignedTo: { include: { user: { select: { name: true, email: true } } } },
          interactions: { orderBy: { createdAt: 'desc' }, take: 50 },
          deals: { orderBy: { createdAt: 'desc' } },
          tasks: { where: { status: { not: 'completed' } }, orderBy: { dueDate: 'asc' } },
        },
      })
      if (byId) {
        const allowed =
          byId.tenantId === jwtTenantId ||
          (await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } }).then((u) => u?.tenantId === byId.tenantId))
        if (allowed) contact = byId
      }
    }

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(contact)
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get contact error:', error)
    return NextResponse.json(
      { error: 'Failed to get contact' },
      { status: 500 }
    )
  }
}

// PATCH /api/contacts/[id] - Update a contact
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveContactTenantId(request, jwtTenantId, userId)

    const body = await request.json()
    const validated = updateContactSchema.parse(body)

    const existing = await prisma.contact.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Check for duplicate email if email is being updated
    if (validated.email && validated.email !== existing.email) {
      const duplicate = await prisma.contact.findFirst({
        where: {
          tenantId: tenantId,
          email: validated.email,
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Contact with this email already exists' },
          { status: 400 }
        )
      }
    }

    const contact = await prisma.contact.update({
      where: { id: resolvedParams.id },
      data: validated,
    })

    // Invalidate cache
    await cache.deletePattern(`contacts:${tenantId}:*`)
    await cache.delete(`contact:${resolvedParams.id}`)
    // Invalidate dashboard stats cache so the count updates immediately
    await cache.delete(`dashboard:stats:${tenantId}`).catch(() => {
      // Ignore cache errors - not critical
    })

    return NextResponse.json(contact)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update contact error:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

// DELETE /api/contacts/[id] - Delete a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveContactTenantId(request, jwtTenantId, userId)

    const existing = await prisma.contact.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    await prisma.contact.delete({
      where: { id: resolvedParams.id },
    })

    // Invalidate cache
    await cache.deletePattern(`contacts:${tenantId}:*`)
    await cache.delete(`contact:${resolvedParams.id}`)
    // Invalidate dashboard stats cache so the count updates immediately
    await cache.delete(`dashboard:stats:${tenantId}`).catch(() => {
      // Ignore cache errors - not critical
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete contact error:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}

