import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { getModule, getAllModules } from '@/lib/modules/moduleRegistry'

/**
 * GET /api/admin/tenants/[tenantId]/modules
 * Get tenant's enabled modules
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    // Check if super admin
    const isSuperAdmin = decoded.roles?.includes('super_admin') || 
                        decoded.role === 'super_admin'
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      )
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.tenantId },
      select: {
        id: true,
        name: true,
        licensedModules: true,
        subscriptionTier: true,
      },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const allModules = getAllModules()
    const enabledModules = tenant.licensedModules || []

    return NextResponse.json({
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      enabled_modules: enabledModules,
      available_modules: allModules.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        category: m.category,
        enabled: enabledModules.includes(m.id),
        enabled_by_default: m.enabled_by_default,
      })),
      subscription_tier: tenant.subscriptionTier,
    })
  } catch (error) {
    console.error('Get tenant modules error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get modules',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/tenants/[tenantId]/modules
 * Enable/disable module for tenant
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    // Check if super admin
    const isSuperAdmin = decoded.roles?.includes('super_admin') || 
                        decoded.role === 'super_admin'
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { moduleId, enabled } = body

    if (!moduleId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'moduleId and enabled are required' },
        { status: 400 }
      )
    }

    // Validate module exists
    const module = getModule(moduleId)
    if (!module) {
      return NextResponse.json(
        { error: 'Invalid module' },
        { status: 400 }
      )
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.tenantId },
      select: {
        id: true,
        licensedModules: true,
      },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Update enabled modules
    const currentModules = tenant.licensedModules || []
    const updatedModules = enabled
      ? [...new Set([...currentModules, moduleId])]
      : currentModules.filter(m => m !== moduleId)

    const updated = await prisma.tenant.update({
      where: { id: params.tenantId },
      data: {
        licensedModules: updatedModules,
      },
      select: {
        id: true,
        licensedModules: true,
      },
    })

    return NextResponse.json({
      success: true,
      tenant: updated,
      message: `Module ${enabled ? 'enabled' : 'disabled'} successfully`,
    })
  } catch (error) {
    console.error('Update tenant modules error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update modules',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
