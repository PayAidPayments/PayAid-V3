import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/projects/dashboard/stats - Get Projects dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'projects')
    
    // Log tenantId for debugging production issues
    console.log('[PROJECTS_DASHBOARD] Fetching stats for tenantId:', tenantId)
    
    if (!tenantId) {
      console.error('[PROJECTS_DASHBOARD] No tenantId found in request')
      return NextResponse.json(
        { error: 'No tenantId found in request' },
        { status: 400 }
      )
    }

    // Verify tenantId exists in database and test connection
    try {
      const tenantExists = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true },
      })
      
      if (!tenantExists) {
        console.error('[PROJECTS_DASHBOARD] Tenant not found in database:', tenantId)
        return NextResponse.json(
          { error: `Tenant ${tenantId} not found in database` },
          { status: 404 }
        )
      }
      
      console.log('[PROJECTS_DASHBOARD] Tenant verified:', tenantExists.name)
    } catch (tenantCheckError: any) {
      console.error('[PROJECTS_DASHBOARD] Error checking tenant:', tenantCheckError)
      
      // Check if it's a database connection error
      const errorMessage = tenantCheckError?.message || String(tenantCheckError || '')
      const isConnectionError = tenantCheckError?.code?.startsWith('P1') ||
                               errorMessage.toLowerCase().includes('can\'t reach') ||
                               errorMessage.toLowerCase().includes('connect') ||
                               errorMessage.toLowerCase().includes('enotfound') ||
                               errorMessage.toLowerCase().includes('econnrefused')
      
      if (isConnectionError) {
        console.error('[PROJECTS_DASHBOARD] Database connection failed during tenant check')
        return NextResponse.json(
          { 
            error: 'Database connection failed',
            message: process.env.VERCEL === '1'
              ? 'Unable to connect to database. Please check your DATABASE_URL configuration in Vercel. If using Supabase, check if your project is paused.'
              : !process.env.DATABASE_URL
                ? 'DATABASE_URL is not set. Please add DATABASE_URL to your .env.local file.'
                : 'Unable to connect to database. Please check your DATABASE_URL in .env.local file. Verify your connection string and ensure Supabase project is active.',
            code: tenantCheckError?.code,
            troubleshooting: {
              steps: [
                '1. Check if DATABASE_URL is set in Vercel environment variables',
                '2. If using Supabase, check if your project is paused: https://supabase.com/dashboard',
                '3. Resume the Supabase project if paused (free tier pauses after inactivity)',
                '4. Wait 1-2 minutes after resuming for the database to activate',
                '5. Verify the database connection string is correct',
              ],
              healthCheck: '/api/health/db',
            },
          },
          { status: 503 }
        )
      }
      
      // Continue anyway for other errors
    }

    // Get current date for calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Fetch all data in parallel
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      totalTasks,
      completedTasks,
      totalTimeLogged,
      projectsByStatus,
      projectsByPriority,
      recentProjects,
    ] = await Promise.all([
      // Total projects
      prisma.project.count({
        where: { tenantId },
      }).catch((err) => {
        console.error('[PROJECTS_DASHBOARD] Error counting total projects:', err)
        return 0
      }),
      
      // Active projects
      prisma.project.count({
        where: {
          tenantId,
          status: 'IN_PROGRESS',
        },
      }).catch(() => 0),
      
      // Completed projects
      prisma.project.count({
        where: {
          tenantId,
          status: 'COMPLETED',
        },
      }).catch(() => 0),
      
      // On hold projects
      prisma.project.count({
        where: {
          tenantId,
          status: 'ON_HOLD',
        },
      }).catch(() => 0),
      
      // Total tasks
      prisma.projectTask.count({
        where: { 
          project: {
            tenantId,
          },
        },
      }).catch(() => 0),
      
      // Completed tasks
      prisma.projectTask.count({
        where: {
          project: {
            tenantId,
          },
          status: 'COMPLETED',
        },
      }).catch(() => 0),
      
      // Total time logged this month
      prisma.timeEntry.aggregate({
        where: {
          project: {
            tenantId,
          },
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { hours: true },
      }).catch(() => ({ _sum: { hours: null } })),
      
      // Projects by status
      prisma.project.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
      }).catch(() => []),
      
      // Projects by priority
      prisma.project.groupBy({
        by: ['priority'],
        where: { tenantId },
        _count: { id: true },
      }).catch(() => []),
      
      // Recent projects (last 5)
      prisma.project.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          progress: true,
          createdAt: true,
        },
      }).catch(() => []),
    ])

    // Monthly project creation (last 6 months)
    // Use Prisma queries instead of raw SQL for database compatibility
    let monthlyProjectCreation: Array<{ month: string; count: number }> = []
    try {
      const projects = await prisma.project.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          createdAt: true,
        },
      })

      // Group by month
      const monthMap = new Map<string, number>()
      projects.forEach((project) => {
        if (project.createdAt) {
          const date = new Date(project.createdAt)
          const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1)
        }
      })

      monthlyProjectCreation = Array.from(monthMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => {
          const dateA = new Date(a.month)
          const dateB = new Date(b.month)
          return dateA.getTime() - dateB.getTime()
        })
    } catch (error) {
      console.error('Error fetching monthly project creation:', error)
      monthlyProjectCreation = []
    }

    // Log results for debugging
    console.log('[PROJECTS_DASHBOARD] Stats fetched successfully:', {
      tenantId,
      totalProjects,
      activeProjects,
      totalTasks,
    })
    
    return NextResponse.json({
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      totalTasks,
      completedTasks,
      totalTimeLogged: Number(totalTimeLogged._sum?.hours || 0) || 0,
      projectsByStatus: Array.isArray(projectsByStatus) 
        ? projectsByStatus.map((p: any) => ({
            status: p?.status || '',
            count: p?._count?.id || 0,
          }))
        : [],
      projectsByPriority: Array.isArray(projectsByPriority) 
        ? projectsByPriority.map((p: any) => ({
            priority: p?.priority || '',
            count: p?._count?.id || 0,
          }))
        : [],
      monthlyProjectCreation: Array.isArray(monthlyProjectCreation) 
        ? monthlyProjectCreation.map((m: any) => ({
            month: m?.month || '',
            count: Number(m?.count) || 0,
          }))
        : [],
      recentProjects: Array.isArray(recentProjects) 
        ? recentProjects.map((p: any) => ({
            id: p?.id || '',
            name: p?.name || '',
            status: p?.status || '',
            progress: p?.progress || 0,
            createdAt: p?.createdAt ? (typeof p.createdAt === 'string' ? p.createdAt : p.createdAt.toISOString()) : new Date().toISOString(),
          }))
        : [],
    })
  } catch (error: any) {
    console.error('[PROJECTS_DASHBOARD] Error fetching stats:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name,
      tenantId: error?.tenantId,
    })
    
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    // Check for database connection errors
    const errorMessage = error?.message || String(error || 'Unknown error')
    const isDatabaseError = error?.code?.startsWith('P1') ||
                           errorMessage.toLowerCase().includes('connect') ||
                           errorMessage.toLowerCase().includes('database') ||
                           errorMessage.toLowerCase().includes('prisma') ||
                           errorMessage.toLowerCase().includes('enotfound') ||
                           errorMessage.toLowerCase().includes('econnrefused') ||
                           errorMessage.toLowerCase().includes('pool') ||
                           errorMessage.toLowerCase().includes('timeout')
    
    if (isDatabaseError) {
      console.error('[PROJECTS_DASHBOARD] Database error detected:', {
        code: error?.code,
        message: errorMessage,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      })
      return NextResponse.json(
        { 
          error: 'Database connection error', 
          message: 'Unable to connect to database. Please check your database configuration.',
          code: error?.code,
        },
        { status: 503 }
      )
    }

    // Return fallback stats with arrays to prevent frontend crashes
    return NextResponse.json(
      { 
        error: 'Failed to fetch projects dashboard stats', 
        message: error?.message,
        // Always return arrays to prevent "t.map is not a function" errors
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        onHoldProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalTimeLogged: 0,
        projectsByStatus: [],
        projectsByPriority: [],
        monthlyProjectCreation: [],
        recentProjects: [],
      },
      { status: 500 }
    )
  }
}

