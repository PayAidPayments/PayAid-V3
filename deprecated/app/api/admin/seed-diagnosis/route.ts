import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId') || user.tenantId

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })
    }

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      tenantId,
      checks: {},
      errors: [],
      warnings: [],
      recommendations: [],
    }

    // Check 1: Database Connection
    try {
      await prisma.$queryRaw`SELECT 1`
      diagnostics.checks.databaseConnection = { status: 'ok', message: 'Database connection successful' }
    } catch (error: any) {
      diagnostics.checks.databaseConnection = { 
        status: 'error', 
        message: error?.message || 'Database connection failed',
        error: String(error)
      }
      diagnostics.errors.push('Database connection failed')
      return NextResponse.json(diagnostics, { status: 200 })
    }

    // Check 2: Tenant Exists
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, status: true },
      })
      if (tenant) {
        diagnostics.checks.tenantExists = { 
          status: 'ok', 
          message: `Tenant found: ${tenant.name}`,
          tenant
        }
      } else {
        diagnostics.checks.tenantExists = { 
          status: 'error', 
          message: `Tenant ${tenantId} not found` 
        }
        diagnostics.errors.push(`Tenant ${tenantId} not found`)
        return NextResponse.json(diagnostics, { status: 200 })
      }
    } catch (error: any) {
      diagnostics.checks.tenantExists = { 
        status: 'error', 
        message: error?.message || 'Error checking tenant',
        error: String(error)
      }
      diagnostics.errors.push('Error checking tenant')
    }

    // Check 3: User Exists
    try {
      const userRecord = await prisma.user.findFirst({
        where: { tenantId, email: user.email },
        select: { id: true, email: true, role: true },
      })
      if (userRecord) {
        diagnostics.checks.userExists = { 
          status: 'ok', 
          message: `User found: ${userRecord.email}`,
          user: userRecord
        }
      } else {
        diagnostics.checks.userExists = { 
          status: 'warning', 
          message: `User ${user.email} not found for tenant` 
        }
        diagnostics.warnings.push(`User ${user.email} not found for tenant`)
      }
    } catch (error: any) {
      diagnostics.checks.userExists = { 
        status: 'error', 
        message: error?.message || 'Error checking user',
        error: String(error)
      }
    }

    // Check 4: SalesRep Exists
    try {
      const salesRep = await prisma.salesRep.findFirst({
        where: { tenantId },
        select: { id: true, userId: true, specialization: true },
      })
      if (salesRep) {
        diagnostics.checks.salesRepExists = { 
          status: 'ok', 
          message: `SalesRep found: ${salesRep.id}`,
          salesRep
        }
      } else {
        diagnostics.checks.salesRepExists = { 
          status: 'error', 
          message: 'No SalesRep found for tenant. Deals require assignedToId (SalesRep.id)' 
        }
        diagnostics.errors.push('No SalesRep found - deals cannot be created without assignedToId')
        diagnostics.recommendations.push('Create a SalesRep for the user before seeding deals')
      }
    } catch (error: any) {
      diagnostics.checks.salesRepExists = { 
        status: 'error', 
        message: error?.message || 'Error checking SalesRep',
        error: String(error)
      }
    }

    // Check 5: Contacts Exist
    try {
      const contactCount = await prisma.contact.count({ where: { tenantId } })
      if (contactCount > 0) {
        diagnostics.checks.contactsExist = { 
          status: 'ok', 
          message: `${contactCount} contacts found`,
          count: contactCount
        }
      } else {
        diagnostics.checks.contactsExist = { 
          status: 'warning', 
          message: 'No contacts found. Deals require contactId' 
        }
        diagnostics.warnings.push('No contacts found - deals need contacts to be created')
        diagnostics.recommendations.push('Seed contacts first, then deals')
      }
    } catch (error: any) {
      diagnostics.checks.contactsExist = { 
        status: 'error', 
        message: error?.message || 'Error checking contacts',
        error: String(error)
      }
    }

    // Check 6: Existing Deals
    let dealCount = 0
    try {
      dealCount = await prisma.deal.count({ where: { tenantId } })
      diagnostics.checks.existingDeals = { 
        status: dealCount > 0 ? 'ok' : 'info', 
        message: `${dealCount} deals currently exist`,
        count: dealCount
      }
    } catch (error: any) {
      diagnostics.checks.existingDeals = { 
        status: 'error', 
        message: error?.message || 'Error checking deals',
        error: String(error)
      }
    }

    // Auto-fix: when 0 deals but contacts + salesRep exist, ensure demo deals so Deals page is never empty
    const contactCount = (diagnostics.checks.contactsExist as any)?.count ?? 0
    const salesRepOk = diagnostics.checks.salesRepExists?.status === 'ok'
    if (dealCount === 0 && contactCount > 0 && salesRepOk) {
      try {
        const ensureUrl = `${request.nextUrl.origin}/api/admin/ensure-demo-data?tenantId=${encodeURIComponent(tenantId)}`
        const ensureRes = await fetch(ensureUrl, {
          headers: {
            cookie: request.headers.get('cookie') || '',
            authorization: request.headers.get('authorization') || '',
          },
        })
        const ensureData = await ensureRes.json().catch(() => ({}))
        if (ensureRes.ok && (ensureData.created?.deals > 0 || (ensureData.counts?.deals ?? 0) > 0)) {
          const newCount = ensureData.counts?.deals ?? (await prisma.deal.count({ where: { tenantId } }))
          diagnostics.checks.existingDeals = {
            status: 'ok',
            message: `${newCount} deals (created by diagnosis auto-fix)`,
            count: newCount,
          }
          diagnostics.recommendations = diagnostics.recommendations || []
          diagnostics.recommendations.push('Demo deals were created. Refresh the Deals page to see them.')
          try {
            const { multiLayerCache } = await import('@/lib/cache/multi-layer')
            await multiLayerCache.deletePattern(`deals:${tenantId}:*`)
            await multiLayerCache.deletePattern(`dashboard:stats:${tenantId}*`)
          } catch (_) {}
        }
      } catch (ensureError: any) {
        console.warn('[SEED_DIAGNOSIS] ensure-demo-data failed:', ensureError?.message)
        diagnostics.recommendations = diagnostics.recommendations || []
        diagnostics.recommendations.push('Run "Seed demo data" or open Ensure demo data to create deals.')
      }
    }

    // Check 7: Try to Create a Test Deal
    try {
      // Get a contact and salesRep for the test
      const [contact, salesRep] = await Promise.all([
        prisma.contact.findFirst({ where: { tenantId }, select: { id: true } }),
        prisma.salesRep.findFirst({ where: { tenantId }, select: { id: true } }),
      ])

      if (!contact) {
        diagnostics.checks.testDealCreation = { 
          status: 'error', 
          message: 'Cannot test deal creation: No contacts available' 
        }
        diagnostics.errors.push('No contacts available to test deal creation')
      } else if (!salesRep) {
        diagnostics.checks.testDealCreation = { 
          status: 'error', 
          message: 'Cannot test deal creation: No SalesRep available' 
        }
        diagnostics.errors.push('No SalesRep available to test deal creation')
      } else {
        // Try to create a test deal
        try {
          const testDeal = await prisma.deal.create({
            data: {
              tenantId,
              name: 'Diagnostic Test Deal - Will be deleted',
              value: 10000,
              stage: 'lead',
              probability: 50,
              contactId: contact.id,
              assignedToId: salesRep.id,
            },
          })
          
          // Delete the test deal
          await prisma.deal.delete({ where: { id: testDeal.id } })
          
          diagnostics.checks.testDealCreation = { 
            status: 'ok', 
            message: 'Test deal created and deleted successfully',
            testDeal: { id: testDeal.id, name: testDeal.name }
          }
        } catch (dealError: any) {
          diagnostics.checks.testDealCreation = { 
            status: 'error', 
            message: dealError?.message || 'Failed to create test deal',
            errorCode: dealError?.code,
            errorMeta: dealError?.meta,
            error: String(dealError)
          }
          diagnostics.errors.push(`Test deal creation failed: ${dealError?.message || String(dealError)}`)
          if (dealError?.code) {
            diagnostics.errors.push(`Error code: ${dealError.code}`)
          }
          if (dealError?.meta) {
            diagnostics.errors.push(`Error details: ${JSON.stringify(dealError.meta)}`)
          }
        }
      }
    } catch (error: any) {
      diagnostics.checks.testDealCreation = { 
        status: 'error', 
        message: error?.message || 'Error during test deal creation',
        error: String(error)
      }
    }

    // Check 8: Database Schema - Verify Deal model fields
    try {
      // Try to query deal schema info
      const sampleDeal = await prisma.deal.findFirst({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          tenantId: true,
          contactId: true,
          assignedToId: true,
          stage: true,
          value: true,
        },
      })
      if (sampleDeal) {
        diagnostics.checks.dealSchema = { 
          status: 'ok', 
          message: 'Deal schema accessible',
          sampleFields: Object.keys(sampleDeal)
        }
      } else {
        diagnostics.checks.dealSchema = { 
          status: 'info', 
          message: 'Deal schema accessible (no existing deals to sample)' 
        }
      }
    } catch (error: any) {
      diagnostics.checks.dealSchema = { 
        status: 'error', 
        message: error?.message || 'Error checking deal schema',
        error: String(error)
      }
      diagnostics.errors.push('Error accessing deal schema - possible migration issue')
    }

    // Summary
    const hasErrors = diagnostics.errors.length > 0
    const hasWarnings = diagnostics.warnings.length > 0
    diagnostics.summary = {
      status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'ok',
      totalChecks: Object.keys(diagnostics.checks).length,
      passedChecks: Object.values(diagnostics.checks).filter((c: any) => c.status === 'ok').length,
      failedChecks: Object.values(diagnostics.checks).filter((c: any) => c.status === 'error').length,
      warnings: diagnostics.warnings.length,
    }

    return NextResponse.json(diagnostics, { status: 200 })
  } catch (error: any) {
    console.error('[SEED_DIAGNOSIS] Error:', error)
    return NextResponse.json(
      {
        error: 'Diagnosis failed',
        message: error?.message || String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
