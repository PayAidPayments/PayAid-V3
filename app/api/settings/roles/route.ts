import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { createRole } from '@/lib/rbac/roles'
import { z } from 'zod'

const createRoleSchema = z.object({
  roleName: z.string().min(1).max(100),
  description: z.string().optional(),
  roleType: z.enum(['admin', 'manager', 'user', 'custom']).default('custom'),
  permissions: z.array(z.string()).default([]),
})

/**
 * GET /api/settings/roles - List roles for current tenant
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = await prisma.role.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { roleName: 'asc' },
      select: {
        id: true,
        roleName: true,
        description: true,
        roleType: true,
        permissions: true,
        isSystem: true,
        isActive: true,
        createdAt: true,
        _count: { select: { userRoles: true } },
      },
    })

    return NextResponse.json({ roles })
  } catch (e) {
    console.error('GET settings/roles:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to list roles' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/roles - Create custom role
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createRoleSchema.parse(body)

    const role = await createRole({
      tenantId: user.tenantId,
      roleName: parsed.roleName.trim(),
      description: parsed.description?.trim(),
      roleType: parsed.roleType,
      permissions: parsed.permissions,
      isSystem: false,
    })

    return NextResponse.json({ role }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    if (e instanceof Error && e.message?.includes('Unique constraint')) {
      return NextResponse.json({ error: 'A role with this name already exists' }, { status: 400 })
    }
    console.error('POST settings/roles:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create role' },
      { status: 500 }
    )
  }
}
