import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { initializeDefaultRoles } from '@/lib/rbac/roles'
import { verifyToken } from '@/lib/auth/jwt'

/**
 * POST /api/admin/initialize-roles
 * Initialize default roles for a tenant
 * 
 * Requires authentication and admin role
 */
export async function POST(request: NextRequest) {
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
    let decoded
    try {
      decoded = verifyToken(token)
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const isAdmin = decoded.roles?.includes('admin') || decoded.role === 'admin'
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { tenantId } = body

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Initialize roles
    const roles = await initializeDefaultRoles(tenantId)

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
      roles: roles.map(r => ({
        id: r.id,
        roleName: r.roleName,
        roleType: r.roleType,
        isSystem: r.isSystem,
      })),
      message: `Initialized ${roles.length} default roles for ${tenant.name}`,
    })
  } catch (error) {
    console.error('Error initializing roles:', error)
    return NextResponse.json(
      { 
        error: 'Failed to initialize roles',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
