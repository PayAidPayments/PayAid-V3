/**
 * Debug endpoint to test database connection and verify data exists
 * GET /api/super-admin/debug-db
 */

import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    await requireSuperAdmin()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }

  try {
    // Test basic database connection
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`.catch((e) => {
      return [{ test: null, error: e.message }]
    })

    // Count tenants
    const tenantCount = await prisma.tenant.count().catch((e) => {
      return { error: e.message, count: 0 }
    })

    // Get first few tenants
    const tenants = await prisma.tenant.findMany({
      take: 5,
      select: { id: true, name: true, subdomain: true, status: true },
    }).catch((e) => {
      return { error: e.message, data: [] }
    })

    // Count users
    const userCount = await prisma.user.count().catch((e) => {
      return { error: e.message, count: 0 }
    })

    // Get first few users
    const users = await prisma.user.findMany({
      take: 5,
      select: { id: true, email: true, name: true, role: true, tenantId: true },
    }).catch((e) => {
      return { error: e.message, data: [] }
    })

    return NextResponse.json({
      dbConnection: dbTest,
      tenants: {
        count: typeof tenantCount === 'number' ? tenantCount : tenantCount.count || 0,
        error: typeof tenantCount === 'object' && 'error' in tenantCount ? tenantCount.error : null,
        sample: Array.isArray(tenants) ? tenants : tenants.data || [],
        sampleError: Array.isArray(tenants) ? null : tenants.error || null,
      },
      users: {
        count: typeof userCount === 'number' ? userCount : userCount.count || 0,
        error: typeof userCount === 'object' && 'error' in userCount ? userCount.error : null,
        sample: Array.isArray(users) ? users : users.data || [],
        sampleError: Array.isArray(users) ? null : users.error || null,
      },
    })
  } catch (e) {
    console.error('Debug DB error:', e)
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : 'Server error',
        stack: e instanceof Error ? e.stack : undefined,
      },
      { status: 500 }
    )
  }
}
