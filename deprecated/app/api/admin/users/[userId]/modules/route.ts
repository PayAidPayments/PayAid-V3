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
      select: { tenantId: true, role: true },
    })

    if (!user || user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's roles
    const userRoles = await prisma.userRole.findMany({
      where: { userId, tenantId },
      include: {
        role: {
          include: {
            moduleAccess: {
              select: {
                moduleName: true,
                canView: true,
                canCreate: true,
                canEdit: true,
                canDelete: true,
                canAdmin: true,
              },
            },
          },
        },
      },
    })

    // Aggregate module access from all roles
    const moduleAccess: Record<string, boolean> = {}
    
    // Get tenant's licensed modules
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { licensedModules: true },
    })

    const licensedModules = (tenant?.licensedModules as string[]) || []

    // For now, we'll use a simple approach: check if user has any role with access to a module
    // In a full implementation, you'd check ModuleAccess records
    // For simplicity, we'll allow access if the module is licensed for the tenant
    // and the user has a role (or is admin/owner)
    const hasAdminRole = user.role === 'admin' || user.role === 'owner'
    
    // TODO: Implement proper module access checking based on ModuleAccess table
    // For now, return licensed modules as accessible for admin/owner, empty for others
    licensedModules.forEach((module) => {
      moduleAccess[module] = hasAdminRole || userRoles.length > 0
    })

    return NextResponse.json({ data: moduleAccess })
  } catch (e) {
    console.error('Get user modules error:', e)
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
    const { modules } = body

    if (!modules || typeof modules !== 'object') {
      return NextResponse.json({ error: 'Invalid modules data' }, { status: 400 })
    }

    // Verify user belongs to tenant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    })

    if (!user || user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get or create a role for this user's module access
    // For simplicity, we'll create a custom role per user for module access
    // In production, you'd want a more sophisticated approach
    const userRoleName = `user_${userId}_modules`
    
    let role = await prisma.role.findUnique({
      where: {
        tenantId_roleName: {
          tenantId,
          roleName: userRoleName,
        },
      },
    })

    if (!role) {
      role = await prisma.role.create({
        data: {
          tenantId,
          roleName: userRoleName,
          description: `Module access for user ${userId}`,
          roleType: 'custom',
        },
      })

      // Assign role to user
      await prisma.userRole.create({
        data: {
          tenantId,
          userId,
          roleId: role.id,
          assignedById: decoded.userId || null,
        },
      })
    }

    // Update module access for this role
    const moduleEntries = Object.entries(modules) as [string, boolean][]
    
    for (const [moduleName, hasAccess] of moduleEntries) {
      if (hasAccess) {
        // Check if module access already exists
        const existing = await prisma.moduleAccess.findUnique({
          where: {
            tenantId_roleId_moduleName: {
              tenantId,
              roleId: role.id,
              moduleName,
            },
          },
        })

        // Upsert module access
        await prisma.moduleAccess.upsert({
          where: {
            tenantId_roleId_moduleName: {
              tenantId,
              roleId: role.id,
              moduleName,
            },
          },
          create: {
            tenantId,
            roleId: role.id,
            moduleName,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: false,
            canAdmin: false,
          },
          update: {
            canView: true,
            canCreate: true,
            canEdit: true,
          },
        })
      } else {
        // Remove module access
        await prisma.moduleAccess.deleteMany({
          where: {
            tenantId,
            roleId: role.id,
            moduleName,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Module access updated successfully',
    })
  } catch (e) {
    console.error('Update user modules error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
