import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { seedDemoBusiness } from '@/prisma/seeds/demo/demo-business-master-seed'
import { authenticateRequest } from '@/lib/middleware/auth'
import { isSeedRunning, startSeedTracking, stopSeedTracking } from '@/lib/utils/seed-status'

/**
 * Create optimized Prisma client for seed operations
 * Uses transaction mode and minimal connections to avoid pool exhaustion
 */
function createSeedPrismaClient(): PrismaClient {
  // Priority: 1. Direct connection, 2. Transaction mode pooler, 3. Regular pooler
  let databaseUrl = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Parse and enhance DATABASE_URL with minimal connection pool for seeding
  const url = new URL(databaseUrl)
  
  // CRITICAL: Use only 1 connection to avoid pool exhaustion
  url.searchParams.set('connection_limit', '1')
  
  // Faster timeouts
  url.searchParams.set('pool_timeout', '10')
  url.searchParams.set('connect_timeout', '5')

  // For Supabase pooler, convert to TRANSACTION mode (not session mode)
  // Transaction mode allows more concurrent connections
  if (url.hostname.includes('pooler.supabase.com')) {
    url.searchParams.set('pgbouncer', 'true')
    
    // If port is 5432 (session mode), change to 6543 (transaction mode)
    if (url.port === '5432' || !url.port) {
      url.port = '6543'
    }
  }

  const enhancedDatabaseUrl = url.toString()

  return new PrismaClient({
    datasources: {
      db: {
        url: enhancedDatabaseUrl,
      },
    },
  })
}

// Use optimized Prisma client for this endpoint
const prisma = createSeedPrismaClient()

/**
 * POST /api/admin/seed-now
 * Seed endpoint for production
 * By default runs in background to avoid timeout issues
 * Use ?wait=true to wait for completion (may timeout on large seeds)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Authenticate user
    let user
    try {
      user = await authenticateRequest(request)
    } catch (authError) {
      // In development, allow without auth
      if (process.env.NODE_ENV === 'development') {
        console.warn('[SEED_NOW] Auth failed, allowing in dev mode')
      } else {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Please log in first' },
          { status: 401 }
        )
      }
    }
    
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId') || user?.tenantId
    const wait = searchParams.get('wait') === 'true' // Option to wait for completion (may timeout)
    const checkStatus = searchParams.get('checkStatus') === 'true'
    
    if (!tenantId) {
      return NextResponse.json(
        { 
          error: 'Tenant ID required',
          message: 'Please provide tenantId parameter or ensure you are logged in',
        },
        { status: 400 }
      )
    }
    
    // Check status if requested
    if (checkStatus) {
      const seedStatus = isSeedRunning(tenantId)
      const [contacts, deals, tasks] = await Promise.all([
        prisma.contact.count({ where: { tenantId } }).catch(() => 0),
        prisma.deal.count({ where: { tenantId } }).catch(() => 0),
        prisma.task.count({ where: { tenantId } }).catch(() => 0),
      ])
      
      return NextResponse.json({
        tenantId,
        seedRunning: seedStatus.running,
        elapsedSeconds: seedStatus.elapsed ? Math.floor(seedStatus.elapsed / 1000) : 0,
        elapsedMinutes: seedStatus.elapsed ? Math.floor(seedStatus.elapsed / 60000) : 0,
        currentData: { contacts, deals, tasks },
        hasData: contacts > 0 || deals > 0 || tasks > 0,
      })
    }
    
    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true },
    })
    
    if (!tenant) {
      return NextResponse.json(
        { 
          error: 'Tenant not found',
          message: `Tenant with ID ${tenantId} does not exist`,
        },
        { status: 404 }
      )
    }
    
    // Check if seed is already running
    const seedStatus = isSeedRunning(tenantId)
    if (seedStatus.running) {
      const elapsedSeconds = Math.floor((seedStatus.elapsed || 0) / 1000)
      return NextResponse.json({
        success: true,
        message: `Seed operation already in progress. Started ${elapsedSeconds} seconds ago.`,
        alreadyRunning: true,
        tenantId,
        tenantName: tenant.name,
        elapsedSeconds,
        checkStatus: `/api/admin/seed-now?tenantId=${tenantId}&checkStatus=true`,
      })
    }
    
    // Check current data counts before seeding
    const [beforeContacts, beforeDeals, beforeTasks] = await Promise.all([
      prisma.contact.count({ where: { tenantId } }).catch(() => 0),
      prisma.deal.count({ where: { tenantId } }).catch(() => 0),
      prisma.task.count({ where: { tenantId } }).catch(() => 0),
    ])
    
    console.log(`[SEED_NOW] 🚀 Starting seed for tenant: ${tenant.name} (${tenantId})`)
    console.log(`[SEED_NOW] ⏰ Start time: ${new Date().toISOString()}`)
    console.log(`[SEED_NOW] 📊 Data before seed: ${beforeContacts} contacts, ${beforeDeals} deals, ${beforeTasks} tasks`)
    console.log(`[SEED_NOW] Mode: ${wait ? 'WAIT (synchronous)' : 'BACKGROUND (async)'}`)
    
    // If wait=true, run synchronously (may timeout on large seeds)
    if (wait) {
      try {
        const seedResult = await seedDemoBusiness(tenantId)
        console.log(`[SEED_NOW] ✅ Seed function completed successfully`)
        
        // Wait a moment for database to sync
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Verify data was created
        const [afterContacts, afterDeals, afterTasks, invoices, orders] = await Promise.all([
          prisma.contact.count({ where: { tenantId } }).catch(() => 0),
          prisma.deal.count({ where: { tenantId } }).catch(() => 0),
          prisma.task.count({ where: { tenantId } }).catch(() => 0),
          prisma.invoice.count({ where: { tenantId } }).catch(() => 0),
          prisma.order.count({ where: { tenantId } }).catch(() => 0),
        ])
        
        const totalCreated = (afterContacts - beforeContacts) + (afterDeals - beforeDeals) + (afterTasks - beforeTasks) + invoices + orders
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
        
        return NextResponse.json({
          success: true,
          message: `Seed completed successfully! Created ${totalCreated} records.`,
          tenantId,
          tenantName: tenant.name,
          elapsedSeconds,
          dataCreated: {
            contacts: afterContacts - beforeContacts,
            deals: afterDeals - beforeDeals,
            tasks: afterTasks - beforeTasks,
            invoices,
            orders,
            total: totalCreated,
          },
          seedResult,
        })
      } catch (seedError: any) {
        console.error(`[SEED_NOW] ❌ Seed function failed:`, seedError)
        return NextResponse.json(
          {
            success: false,
            error: 'Seed function failed',
            message: seedError?.message || String(seedError),
            tenantId,
            tenantName: tenant.name,
          },
          { status: 500 }
        )
      }
    }
    
    // Default: Run in background (recommended to avoid timeouts)
    const seedStartTime = Date.now()
    const seedPromise = (async () => {
      try {
        console.log(`[SEED_NOW] 🚀 Starting background seed for tenant: ${tenantId}`)
        const seedResult = await seedDemoBusiness(tenantId)
        console.log(`[SEED_NOW] ✅ Background seed completed`)
        
        // Wait a moment for database to sync
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Verify data
        const [contacts, deals, tasks, invoices, orders] = await Promise.all([
          prisma.contact.count({ where: { tenantId } }).catch(() => 0),
          prisma.deal.count({ where: { tenantId } }).catch(() => 0),
          prisma.task.count({ where: { tenantId } }).catch(() => 0),
          prisma.invoice.count({ where: { tenantId } }).catch(() => 0),
          prisma.order.count({ where: { tenantId } }).catch(() => 0),
        ])
        
        const totalData = contacts + deals + tasks + invoices + orders
        const elapsedSeconds = Math.floor((Date.now() - seedStartTime) / 1000)
        
        console.log(`[SEED_NOW] ⏰ Background seed completed in ${elapsedSeconds} seconds`)
        console.log(`[SEED_NOW] 📊 Data created: ${contacts} contacts, ${deals} deals, ${tasks} tasks, ${invoices} invoices, ${orders} orders`)
        console.log(`[SEED_NOW] 📈 Total: ${totalData} records`)
        
        if (totalData === 0) {
          console.error(`[SEED_NOW] ❌ WARNING: Seed completed but NO data was created`)
        } else if (totalData < 10) {
          console.warn(`[SEED_NOW] ⚠️  WARNING: Very little data created (${totalData} records)`)
        } else {
          console.log(`[SEED_NOW] ✅ Seed successful!`)
        }
      } catch (err: any) {
        const elapsedSeconds = Math.floor((Date.now() - seedStartTime) / 1000)
        console.error(`[SEED_NOW] ❌ Background seed FAILED after ${elapsedSeconds} seconds:`, err)
        throw err
      } finally {
        stopSeedTracking(tenantId)
      }
    })()
    
    // Track the seed
    startSeedTracking(tenantId, seedPromise)
    
    // Don't await - return immediately
    return NextResponse.json({
      success: true,
      message: 'Seed operation started in background. This may take 1-3 minutes. Use ?checkStatus=true to monitor progress.',
      background: true,
      tenantId,
      tenantName: tenant.name,
      checkStatus: `/api/admin/seed-now?tenantId=${tenantId}&checkStatus=true`,
      note: 'Background seeding avoids Vercel timeout limits. Check status or refresh the page in 1-2 minutes.',
    })
  } catch (error: any) {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
    console.error(`[SEED_NOW] ❌ Error after ${elapsedSeconds} seconds:`, error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Seed operation failed',
        message: error?.message || String(error),
        elapsedSeconds,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    )
  } finally {
    // Disconnect the optimized Prisma client
    await prisma.$disconnect().catch(() => {
      // Ignore disconnect errors
    })
  }
}

/**
 * GET /api/admin/seed-now
 * Check seed status, data counts, or show instructions
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')
    const checkStatus = searchParams.get('checkStatus') === 'true'
    
    if (!tenantId) {
      return NextResponse.json({
        message: 'Seed Now - Production Seeding Endpoint',
        instructions: [
          'POST /api/admin/seed-now?tenantId=YOUR_TENANT_ID (runs in background by default)',
          'POST /api/admin/seed-now?tenantId=YOUR_TENANT_ID&wait=true (waits for completion, may timeout)',
          'GET /api/admin/seed-now?tenantId=YOUR_TENANT_ID&checkStatus=true (check seed progress)',
        ],
        examples: [
          'Browser: fetch("/api/admin/seed-now?tenantId=cmjptk2mw0000aocw31u48n64", {method: "POST"})',
          'Check status: fetch("/api/admin/seed-now?tenantId=cmjptk2mw0000aocw31u48n64&checkStatus=true")',
        ],
        note: 'Background mode (default) avoids Vercel timeout limits. Use checkStatus to monitor progress.',
      })
    }
    
    // If checking status
    if (checkStatus) {
      const seedStatus = isSeedRunning(tenantId)
      const [contacts, deals, tasks] = await Promise.all([
        prisma.contact.count({ where: { tenantId } }).catch(() => 0),
        prisma.deal.count({ where: { tenantId } }).catch(() => 0),
        prisma.task.count({ where: { tenantId } }).catch(() => 0),
      ])
      
      return NextResponse.json({
        tenantId,
        seedRunning: seedStatus.running,
        elapsedSeconds: seedStatus.elapsed ? Math.floor(seedStatus.elapsed / 1000) : 0,
        elapsedMinutes: seedStatus.elapsed ? Math.floor(seedStatus.elapsed / 60000) : 0,
        currentData: { contacts, deals, tasks },
        hasData: contacts > 0 || deals > 0 || tasks > 0,
      })
    }
    
    // Check current data
    const [contacts, deals, tasks] = await Promise.all([
      prisma.contact.count({ where: { tenantId } }).catch(() => 0),
      prisma.deal.count({ where: { tenantId } }).catch(() => 0),
      prisma.task.count({ where: { tenantId } }).catch(() => 0),
    ])
    
    const hasData = contacts > 0 || deals > 0 || tasks > 0
    const seedStatus = isSeedRunning(tenantId)
    
    return NextResponse.json({
      tenantId,
      hasData,
      currentCounts: { contacts, deals, tasks },
      needsSeeding: !hasData,
      seedRunning: seedStatus.running,
      action: hasData 
        ? 'Data exists. No seeding needed.'
        : seedStatus.running
        ? `Seed in progress (${Math.floor((seedStatus.elapsed || 0) / 1000)}s elapsed). Check status: ?checkStatus=true`
        : 'POST to /api/admin/seed-now?tenantId=' + tenantId + ' to seed data',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to check seed status',
        message: error?.message || String(error),
      },
      { status: 500 }
    )
  }
}
