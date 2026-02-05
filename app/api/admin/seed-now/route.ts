import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { seedDemoBusiness } from '@/prisma/seeds/demo/demo-business-master-seed'
import { authenticateRequest } from '@/lib/middleware/auth'

/**
 * POST /api/admin/seed-now
 * Direct, synchronous seed endpoint for production
 * This endpoint runs the seed and waits for completion, returning detailed results
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
    
    if (!tenantId) {
      return NextResponse.json(
        { 
          error: 'Tenant ID required',
          message: 'Please provide tenantId parameter or ensure you are logged in',
        },
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
        { 
          error: 'Tenant not found',
          message: `Tenant with ID ${tenantId} does not exist`,
        },
        { status: 404 }
      )
    }
    
    console.log(`[SEED_NOW] 🚀 Starting direct seed for tenant: ${tenant.name} (${tenantId})`)
    console.log(`[SEED_NOW] ⏰ Start time: ${new Date().toISOString()}`)
    
    // Check current data counts before seeding
    const [beforeContacts, beforeDeals, beforeTasks] = await Promise.all([
      prisma.contact.count({ where: { tenantId } }).catch(() => 0),
      prisma.deal.count({ where: { tenantId } }).catch(() => 0),
      prisma.task.count({ where: { tenantId } }).catch(() => 0),
    ])
    
    console.log(`[SEED_NOW] 📊 Data before seed: ${beforeContacts} contacts, ${beforeDeals} deals, ${beforeTasks} tasks`)
    
    // Run the seed
    let seedResult
    try {
      seedResult = await seedDemoBusiness(tenantId)
      console.log(`[SEED_NOW] ✅ Seed function completed successfully`)
    } catch (seedError: any) {
      console.error(`[SEED_NOW] ❌ Seed function failed:`, seedError)
      return NextResponse.json(
        {
          success: false,
          error: 'Seed function failed',
          message: seedError?.message || String(seedError),
          stack: process.env.NODE_ENV === 'development' ? seedError?.stack : undefined,
          tenantId,
          tenantName: tenant.name,
        },
        { status: 500 }
      )
    }
    
    // Wait a moment for database to sync
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Verify data was created
    console.log(`[SEED_NOW] 🔍 Verifying data creation...`)
    const [afterContacts, afterDeals, afterTasks, invoices, orders] = await Promise.all([
      prisma.contact.count({ where: { tenantId } }).catch(() => 0),
      prisma.deal.count({ where: { tenantId } }).catch(() => 0),
      prisma.task.count({ where: { tenantId } }).catch(() => 0),
      prisma.invoice.count({ where: { tenantId } }).catch(() => 0),
      prisma.order.count({ where: { tenantId } }).catch(() => 0),
    ])
    
    const contactsCreated = afterContacts - beforeContacts
    const dealsCreated = afterDeals - beforeDeals
    const tasksCreated = afterTasks - beforeTasks
    const totalCreated = contactsCreated + dealsCreated + tasksCreated + invoices + orders
    
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
    
    console.log(`[SEED_NOW] ⏰ Seed completed in ${elapsedSeconds} seconds`)
    console.log(`[SEED_NOW] 📊 Data after seed:`)
    console.log(`[SEED_NOW]   - Contacts: ${afterContacts} (created: ${contactsCreated})`)
    console.log(`[SEED_NOW]   - Deals: ${afterDeals} (created: ${dealsCreated})`)
    console.log(`[SEED_NOW]   - Tasks: ${afterTasks} (created: ${tasksCreated})`)
    console.log(`[SEED_NOW]   - Invoices: ${invoices}`)
    console.log(`[SEED_NOW]   - Orders: ${orders}`)
    console.log(`[SEED_NOW] 📈 Total records: ${totalCreated}`)
    
    if (totalCreated === 0) {
      console.error(`[SEED_NOW] ❌ CRITICAL: No data was created!`)
      return NextResponse.json(
        {
          success: false,
          error: 'No data created',
          message: 'Seed completed but no data was created. This may indicate a database connection issue or seed function error.',
          tenantId,
          tenantName: tenant.name,
          elapsedSeconds,
          before: { contacts: beforeContacts, deals: beforeDeals, tasks: beforeTasks },
          after: { contacts: afterContacts, deals: afterDeals, tasks: afterTasks, invoices, orders },
          seedResult,
          troubleshooting: [
            'Check database connection: /api/health/db',
            'Check Vercel function logs for errors',
            'Verify DATABASE_URL is set correctly in Vercel',
            'Check if Supabase project is paused',
          ],
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `Seed completed successfully! Created ${totalCreated} records.`,
      tenantId,
      tenantName: tenant.name,
      elapsedSeconds,
      dataCreated: {
        contacts: contactsCreated,
        deals: dealsCreated,
        tasks: tasksCreated,
        invoices,
        orders,
        total: totalCreated,
      },
      currentCounts: {
        contacts: afterContacts,
        deals: afterDeals,
        tasks: afterTasks,
        invoices,
        orders,
      },
      seedResult,
      nextSteps: [
        'Refresh the dashboard page to see the data',
        'Data should appear within 30 seconds',
        'If data still doesn\'t show, check browser console for errors',
      ],
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
  }
}

/**
 * GET /api/admin/seed-now
 * Check if seed is needed and show instructions
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json({
        message: 'Seed Now - Direct Production Seeding',
        instructions: [
          'This endpoint runs seed synchronously and returns detailed results',
          'POST /api/admin/seed-now?tenantId=YOUR_TENANT_ID',
          'Or log in and POST /api/admin/seed-now (will use your tenantId)',
        ],
        example: 'curl -X POST "https://payaid-v3.vercel.app/api/admin/seed-now?tenantId=cmjptk2mw0000aocw31u48n64" -H "Authorization: Bearer YOUR_TOKEN"',
      })
    }
    
    // Check current data
    const [contacts, deals, tasks] = await Promise.all([
      prisma.contact.count({ where: { tenantId } }).catch(() => 0),
      prisma.deal.count({ where: { tenantId } }).catch(() => 0),
      prisma.task.count({ where: { tenantId } }).catch(() => 0),
    ])
    
    const hasData = contacts > 0 || deals > 0 || tasks > 0
    
    return NextResponse.json({
      tenantId,
      hasData,
      currentCounts: { contacts, deals, tasks },
      needsSeeding: !hasData,
      action: hasData 
        ? 'Data exists. No seeding needed.'
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
