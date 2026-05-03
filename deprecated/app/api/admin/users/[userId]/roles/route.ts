import { NextRequest, NextResponse } from 'next/server'
import { requireTenantAdmin } from '@/lib/middleware/requireTenantAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const decoded = await requireTenantAdmin()
    const tenantId = decoded.tenant_id ?? decoded.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    const { userId } = await params

    // Verify user belongs to tenant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    })

    if (!user || user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's roles
    const userRoles = await prisma.userRole.findMany({
      where: { userId, tenantId },
      include: {
        role: {
          select: {
            id: true,
            roleName: true,
            roleType: true,
            description: true,
          },
        },
      },
    })

    return NextResponse.json({
      data: userRoles.map((ur) => ({
        roleId: ur.roleId,
        role: ur.role,
        assignedAt: ur.assignedAt.toISOString(),
      })),
    })
  } catch (e) {
    console.error('Get user roles error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const decoded = await requireTenantAdmin()
    const tenantId = decoded.tenant_id ?? decoded.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    const { userId } = await params
    const body = await request.json()
    const { roleIds } = body

    if (!Array.isArray(roleIds)) {
      return NextResponse.json({ error: 'roleIds must be an array' }, { status: 400 })
    }

    // Verify user belongs to tenant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    })

    if (!user || user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify all roles belong to tenant
    const roles = await prisma.role.findMany({
      where: {
        id: { in: roleIds },
        tenantId,
      },
      select: { id: true },
    })

    if (roles.length !== roleIds.length) {
      return NextResponse.json(
        { error: 'Some roles not found or do not belong to tenant' },
        { status: 400 }
      )
    }

    // Remove all existing role assignments
    await prisma.userRole.deleteMany({
      where: { userId, tenantId },
    })

    // Create new role assignments
    if (roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId: string) => ({
          tenantId,
          userId,
          roleId,
          assignedById: decoded.userId || null,
        })),
      })
    }

    return NextResponse.json({
      success: true,
      message: 'User roles updated successfully',
    })
  } catch (e) {
    console.error('Update user roles error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
