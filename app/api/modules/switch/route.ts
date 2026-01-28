import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { hasModuleAccess, getModule } from '@/lib/modules/moduleRegistry'
import { prisma } from '@/lib/db/prisma'
import { getAccessibleRoutes } from '@/lib/modules/moduleRegistry'

/**
 * POST /api/modules/switch
 * Switch to a different module
 * 
 * Body: { moduleId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: decoded.tenant_id || decoded.tenantId || '' },
      select: { 
        id: true,
        name: true,
        licensedModules: true,
      },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { moduleId } = body

    if (!moduleId) {
      return NextResponse.json(
        { error: 'moduleId is required' },
        { status: 400 }
      )
    }

    // Verify module is enabled for tenant
    if (!tenant.licensedModules?.includes(moduleId)) {
      return NextResponse.json(
        { error: 'Module not enabled for this tenant' },
        { status: 403 }
      )
    }

    // Verify user has access
    const hasAccess = hasModuleAccess(
      moduleId,
      {
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
      },
      tenant
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No access to this module' },
        { status: 403 }
      )
    }

    // Get module config
    const module = getModule(moduleId)
    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      )
    }

    // Get accessible routes for this module
    const accessibleRoutes = getAccessibleRoutes(
      {
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
      },
      tenant
    )

    const moduleRoutes = accessibleRoutes.find(r => r.module === moduleId)

    // Log module access (optional - for analytics)
    // await logModuleAccess(decoded.sub, moduleId, tenant.id)

    return NextResponse.json({
      success: true,
      module: {
        id: module.id,
        name: module.name,
        description: module.description,
        icon: module.icon,
      },
      routes: moduleRoutes?.routes || [],
      defaultRoute: module.routes[0]?.path,
    })
  } catch (error) {
    console.error('Module switch error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to switch module',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
