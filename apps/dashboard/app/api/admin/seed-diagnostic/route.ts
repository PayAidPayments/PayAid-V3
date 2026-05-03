import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { isSeedRunning } from '@/lib/utils/seed-status'

/**
 * GET /api/admin/seed-diagnostic
 * Comprehensive diagnostic endpoint to check seed status, data counts, and database connection
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId parameter is required' },
        { status: 400 }
      )
    }
    
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      tenantId,
      checks: {},
    }
    
    // 1. Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`
      diagnostics.checks.databaseConnection = { status: 'connected', error: null }
    } catch (dbError: any) {
      diagnostics.checks.databaseConnection = {
        status: 'failed',
        error: dbError?.message || String(dbError),
        code: dbError?.code,
      }
    }
    
    // 2. Check if tenant exists
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, subdomain: true },
      })
      diagnostics.checks.tenantExists = {
        status: tenant ? 'found' : 'not_found',
        tenant: tenant || null,
      }
    } catch (error: any) {
      diagnostics.checks.tenantExists = {
        status: 'error',
        error: error?.message || String(error),
      }
    }
    
    // 3. Check seed status
    const seedStatus = isSeedRunning(tenantId)
    diagnostics.checks.seedStatus = {
      running: seedStatus.running,
      elapsed: seedStatus.elapsed,
      elapsedSeconds: seedStatus.elapsed ? Math.floor(seedStatus.elapsed / 1000) : 0,
      elapsedMinutes: seedStatus.elapsed ? Math.floor(seedStatus.elapsed / 60000) : 0,
    }
    
    // 4. Check data counts
    try {
      const [contacts, deals, tasks, invoices, orders, leadSources] = await Promise.all([
        prisma.contact.count({ where: { tenantId } }).catch(() => 0),
        prisma.deal.count({ where: { tenantId } }).catch(() => 0),
        prisma.task.count({ where: { tenantId } }).catch(() => 0),
        prisma.invoice.count({ where: { tenantId } }).catch(() => 0),
        prisma.order.count({ where: { tenantId } }).catch(() => 0),
        prisma.leadSource.count({ where: { tenantId } }).catch(() => 0),
      ])
      
      const totalData = contacts + deals + tasks + invoices + orders
      diagnostics.checks.dataCounts = {
        status: 'success',
        counts: {
          contacts,
          deals,
          tasks,
          invoices,
          orders,
          leadSources,
          total: totalData,
        },
        hasData: totalData > 0,
        recommendation: totalData === 0 
          ? 'No data found. Run seed: /api/admin/seed-demo-data?comprehensive=true&background=true'
          : totalData < 10
          ? 'Very little data. Consider running comprehensive seed.'
          : 'Data exists. Dashboard should show data.',
      }
    } catch (error: any) {
      diagnostics.checks.dataCounts = {
        status: 'error',
        error: error?.message || String(error),
      }
    }
    
    // 5. Check for admin user
    try {
      const adminUser = await prisma.user.findFirst({
        where: {
          tenantId,
          email: 'admin@demo.com',
        },
        select: { id: true, email: true, name: true },
      })
      diagnostics.checks.adminUser = {
        status: adminUser ? 'found' : 'not_found',
        user: adminUser || null,
      }
    } catch (error: any) {
      diagnostics.checks.adminUser = {
        status: 'error',
        error: error?.message || String(error),
      }
    }
    
    // Summary
    const allChecksPassed = 
      diagnostics.checks.databaseConnection?.status === 'connected' &&
      diagnostics.checks.tenantExists?.status === 'found' &&
      diagnostics.checks.dataCounts?.hasData === true
    
    diagnostics.summary = {
      allChecksPassed,
      status: allChecksPassed ? 'healthy' : 'issues_detected',
      issues: [
        diagnostics.checks.databaseConnection?.status !== 'connected' && 'Database connection failed',
        diagnostics.checks.tenantExists?.status !== 'found' && 'Tenant not found',
        !diagnostics.checks.dataCounts?.hasData && 'No data found for tenant',
      ].filter(Boolean),
      recommendations: [
        diagnostics.checks.databaseConnection?.status !== 'connected' && 'Check DATABASE_URL in Vercel environment variables',
        diagnostics.checks.tenantExists?.status !== 'found' && 'Verify tenantId is correct',
        !diagnostics.checks.dataCounts?.hasData && 'Run: POST /api/admin/seed-demo-data?comprehensive=true&background=true',
        diagnostics.checks.seedStatus?.running && 'Seed is currently running. Wait for completion.',
      ].filter(Boolean),
    }
    
    return NextResponse.json(diagnostics, {
      status: allChecksPassed ? 200 : 503,
    })
  } catch (error: any) {
    console.error('[SEED_DIAGNOSTIC] Error:', error)
    return NextResponse.json(
      {
        error: 'Diagnostic check failed',
        message: error?.message || String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
