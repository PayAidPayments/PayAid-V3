import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { cache } from '@/lib/redis/client'
import { assertCrmRoleAllowed, CrmRoleError } from '@/lib/crm/rbac'
import { logCrmAudit } from '@/lib/audit-log-crm'

async function resolveCrmRequestTenantId(
  request: NextRequest,
  jwtTenantId: string,
  userId: string
): Promise<string> {
  const requestTenantId = request.nextUrl.searchParams.get('tenantId') || ''
  if (!requestTenantId || requestTenantId === jwtTenantId) return jwtTenantId

  const user = await prisma.user
    .findUnique({
      where: { id: userId },
      select: { tenantId: true, email: true },
    })
    .catch(() => null)

  if (user?.tenantId === requestTenantId) return requestTenantId

  const allowDemoTenantOverride = process.env.NEXT_PUBLIC_CRM_ALLOW_DEMO_SEED === '1'
  const isDemoAdmin = allowDemoTenantOverride && user?.email === 'admin@demo.com'
  if (isDemoAdmin) {
    const isDemoTenant = await prisma.tenant
      .findUnique({ where: { id: requestTenantId }, select: { name: true } })
      .then((t) => t?.name?.toLowerCase().includes('demo') ?? false)
      .catch(() => false)
    if (isDemoTenant) return requestTenantId
  }

  return jwtTenantId
}

async function buildContact360(_tenantId: string, contact: any) {
  return {
    accountDeals: Array.isArray(contact?.deals) ? contact.deals : [],
    accountOrders: [],
    accountQuotes: [],
    invoices: [],
    proposals: [],
    contracts: [],
    relatedContacts: [],
    activityFeed: Array.isArray(contact?.interactions) ? contact.interactions : [],
  }
}

/** Whether this user may read a contact that lives in contactTenantId (aligns with list endpoint rules). */
async function userMayReadContactInTenant(
  request: NextRequest,
  userId: string,
  jwtTenantId: string,
  contactTenantId: string
): Promise<boolean> {
  const allowDemoTenantOverride = process.env.NEXT_PUBLIC_CRM_ALLOW_DEMO_SEED === '1'
  if (contactTenantId === jwtTenantId) return true
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true, email: true },
  }).catch(() => null)
  if (user?.tenantId === contactTenantId) return true
  const requestTenantId = request.nextUrl.searchParams.get('tenantId') || undefined
  if (requestTenantId && requestTenantId === contactTenantId) {
    const hasAccess =
      jwtTenantId === requestTenantId ||
      user?.tenantId === requestTenantId ||
      (allowDemoTenantOverride &&
        user?.email === 'admin@demo.com' &&
        (await prisma.tenant
          .findUnique({ where: { id: requestTenantId }, select: { name: true } })
          .then((t) => t?.name?.toLowerCase().includes('demo') ?? false)
          .catch(() => false)))
    return hasAccess
  }
  return false
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
  internalNotes: z.string().optional().transform((v) => (v === '' ? undefined : v)),
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
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)

    const include360 =
      request.nextUrl.searchParams.get('include360') === '1' ||
      request.nextUrl.searchParams.get('include360') === 'true'

    const contactInclude = {
      account: {
        select: {
          id: true,
          name: true,
          type: true,
          industry: true,
          website: true,
          city: true,
          parentAccountId: true,
          parentAccount: { select: { id: true, name: true } },
        },
      },
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
      // 360 page only needs recent activity hint; timeline has its own dedicated API calls.
      interactions: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        select: { id: true, type: true, createdAt: true },
      },
      deals: {
        orderBy: { createdAt: 'desc' as const },
        take: 25,
        select: { id: true, name: true, value: true, stage: true, createdAt: true },
      },
      tasks: {
        // Keep timeline task context inclusive so reassigned/newly-created tasks are visible.
        where: { status: { notIn: ['cancelled'] as const } },
        orderBy: [{ createdAt: 'desc' as const }],
        take: 100,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          dueDate: true,
          createdAt: true,
          priority: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    }

    let contact = await prisma.contact.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
      include: contactInclude,
    })

    // Fallback: find by id only when tenant filter missed (e.g. URL tenant vs JWT tenant, or list/cache drift)
    if (!contact) {
      const byId = await prisma.contact.findUnique({
        where: { id: resolvedParams.id },
        include: contactInclude,
      })
      if (byId) {
        const allowed = await userMayReadContactInTenant(request, userId, jwtTenantId, byId.tenantId)
        if (allowed) contact = byId
      }
    }

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    if (include360) {
      try {
        // Always scope 360 data to the contact's true tenant (resolved tenant can differ on fallback reads)
        const contact360 = await buildContact360(contact.tenantId, {
          id: contact.id,
          email: contact.email,
          phone: contact.phone,
          gstin: contact.gstin,
          accountId: contact.accountId,
          company: contact.company,
          account: contact.account,
        })
        return NextResponse.json({ ...contact, contact360 })
      } catch (contact360Error) {
        // Keep contact detail page usable even if a non-critical 360 widget query fails.
        console.error('Build contact 360 error:', contact360Error)
        return NextResponse.json(contact)
      }
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
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)

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
          NOT: { id: resolvedParams.id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          {
            error: 'A contact with this email already exists',
            code: 'DUPLICATE_EMAIL',
            existingId: duplicate.id,
          },
          { status: 409 }
        )
      }
    }

    // Duplicate phone parity with POST create (trimmed, tenant-scoped, exclude self)
    if (validated.phone?.trim()) {
      const normalized = validated.phone.trim()
      const existingPhone = existing.phone?.trim() || ''
      if (normalized !== existingPhone) {
        const duplicateByPhone = await prisma.contact.findFirst({
          where: {
            tenantId,
            phone: normalized,
            NOT: { id: resolvedParams.id },
          },
          select: { id: true, name: true },
        })
        if (duplicateByPhone) {
          return NextResponse.json(
            {
              error: 'A contact with this phone number already exists',
              code: 'DUPLICATE_PHONE',
              existingId: duplicateByPhone.id,
            },
            { status: 409 }
          )
        }
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
    const { userId, tenantId: jwtTenantId, roles } = await requireModuleAccess(request, 'crm')
    assertCrmRoleAllowed(roles, ['admin', 'manager'], 'contact delete')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)

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

    await logCrmAudit({
      tenantId,
      userId,
      entityType: 'contact',
      entityId: resolvedParams.id,
      action: 'delete',
      changeSummary: `Contact deleted: ${existing.name}`,
      beforeSnapshot: { name: existing.name, email: existing.email, phone: existing.phone, stage: existing.stage },
    })

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
    if (error instanceof CrmRoleError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error('Delete contact error:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}

