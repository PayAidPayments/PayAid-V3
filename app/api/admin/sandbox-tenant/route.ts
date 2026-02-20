import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createSandboxSchema = z.object({
  name: z.string().min(1),
})

/** GET /api/admin/sandbox-tenant - List sandbox tenants */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // Get sandbox tenants (check industrySettings for sandbox flag)
    const sandboxes = await prisma.tenant.findMany({
      where: {
        // Use industrySettings to identify sandbox tenants
        industrySettings: {
          path: ['isSandbox'],
          equals: true,
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ sandboxes })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to list sandboxes' },
      { status: 500 }
    )
  }
}

/** POST /api/admin/sandbox-tenant - Create sandbox tenant */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = createSandboxSchema.parse(body)

    // Create sandbox tenant
    const sandbox = await prisma.tenant.create({
      data: {
        name: validated.name,
        industry: 'service-business', // Default industry
        industrySettings: {
          isSandbox: true,
          parentTenantId: tenantId,
        },
      },
    })

    return NextResponse.json({
      sandbox: {
        id: sandbox.id,
        name: sandbox.name,
        createdAt: sandbox.createdAt,
      },
    }, { status: 201 })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: e.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create sandbox' },
      { status: 500 }
    )
  }
}
