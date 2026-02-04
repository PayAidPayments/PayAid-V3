import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import * as bcrypt from 'bcryptjs'
import { generateTenantId } from '@/lib/utils/tenant-id'
import { seedAllModules } from '@/lib/seed/module-seeders'
import { seedDemoBusiness } from '@/prisma/seeds/demo/demo-business-master-seed'

// Increase timeout for seed route (Vercel Pro: 60s, Hobby: 10s)
// Note: On Hobby plan, this will still timeout at 10s, but we handle it gracefully
export const maxDuration = 60
export const runtime = 'nodejs'

import { isSeedRunning, startSeedTracking, stopSeedTracking } from '@/lib/utils/seed-status'

const SEED_TIMEOUT_MS = 300000 // 5 minutes max for comprehensive seed

// Inline industry seeding functions
async function seedIndustryDataInline(tenantId: string, contacts: any[]) {
  // Agriculture
  const crops = [
    { cropName: 'Wheat', cropType: 'CEREAL', season: 'RABI', area: 10, status: 'GROWING' },
    { cropName: 'Rice', cropType: 'CEREAL', season: 'KHARIF', area: 15, status: 'SOWN' },
    { cropName: 'Tomato', cropType: 'VEGETABLE', season: 'SUMMER', area: 5, status: 'GROWING' },
  ]
  for (const crop of crops) {
    await prisma.agricultureCrop.upsert({
      where: { id: `crop-${crop.cropName.toLowerCase()}` },
      update: {},
      create: {
        id: `crop-${crop.cropName.toLowerCase()}`,
        tenantId,
        cropName: crop.cropName,
        cropType: crop.cropType,
        season: crop.season,
        area: crop.area,
        sowingDate: new Date(),
        expectedHarvestDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        status: crop.status,
      },
    })
  }

  // Healthcare - Create patients and lab tests
  if (contacts.length > 0) {
    for (let i = 0; i < Math.min(3, contacts.length); i++) {
      const contact = contacts[i]
      const patient = await prisma.healthcarePatient.upsert({
        where: { id: `patient-${i + 1}` },
        update: {},
        create: {
          id: `patient-${i + 1}`,
          tenantId,
          contactId: contact.id,
          patientId: `PAT-${String(i + 1).padStart(4, '0')}`,
          fullName: contact.name,
          phone: contact.phone,
          email: contact.email,
        },
      })

      await prisma.healthcareLabTest.upsert({
        where: { id: `labtest-${i + 1}` },
        update: {},
        create: {
          id: `labtest-${i + 1}`,
          tenantId,
          patientId: patient.id,
          testName: ['Complete Blood Count', 'Blood Sugar', 'Chest X-Ray'][i],
          testType: 'BLOOD',
          status: i === 0 ? 'COMPLETED' : 'ORDERED',
          labName: 'City Diagnostic Lab',
        },
      })
    }
  }

  // Education - Create students
  if (contacts.length > 0) {
    for (let i = 0; i < Math.min(5, contacts.length); i++) {
      const contact = contacts[i]
      await prisma.educationStudent.upsert({
        where: { id: `student-${i + 1}` },
        update: {},
        create: {
          id: `student-${i + 1}`,
          tenantId,
          contactId: contact.id,
          studentId: `STU-${String(i + 1).padStart(4, '0')}`,
          fullName: contact.name,
          phone: contact.phone,
          email: contact.email,
          admissionDate: new Date(),
          status: 'ACTIVE',
        },
      })
    }
  }
}

/**
 * GET /api/admin/seed-demo-data
 * Shows instructions or triggers seeding (for browser access)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const trigger = searchParams.get('trigger') === 'true'
    const checkStatus = searchParams.get('checkStatus') === 'true'
    const tenantId = searchParams.get('tenantId')
    
    // If checkStatus=true, return seed status
    if (checkStatus) {
      const seedStatus = isSeedRunning(tenantId || undefined)
      return NextResponse.json({
        running: seedStatus.running,
        elapsed: seedStatus.elapsed,
        elapsedMinutes: seedStatus.elapsed ? Math.floor(seedStatus.elapsed / 60000) : 0,
      })
    }
    
    // If trigger=true, actually seed the data
    if (trigger) {
      const comprehensive = searchParams.get('comprehensive') === 'true'
      const background = searchParams.get('background') === 'true'
      
      // If background mode, start in background
      if (background) {
        const demoTenant = await prisma.tenant.findFirst({
          where: { name: { contains: 'Demo Business', mode: 'insensitive' } },
        })
        if (comprehensive && demoTenant) {
          seedDemoBusiness(demoTenant.id).catch((err) => {
            console.error('[SEED_DEMO_DATA] Background comprehensive seed error:', err)
          })
        } else {
          seedDemoData().catch((err) => {
            console.error('[SEED_DEMO_DATA] Background seed error:', err)
          })
        }
        return NextResponse.json({
          success: true,
          message: 'Seed operation started in background. This may take 30-60 seconds. Please refresh the page in a minute.',
          background: true,
          comprehensive: !!comprehensive,
        })
      }
      
      // Otherwise, call the POST handler logic
      let result
      if (comprehensive) {
        const demoTenant = await prisma.tenant.findFirst({
          where: { name: { contains: 'Demo Business', mode: 'insensitive' } },
        })
        if (demoTenant) {
          result = await seedDemoBusiness(demoTenant.id)
        } else {
          result = await seedDemoData()
        }
      } else {
        result = await seedDemoData()
      }
      
      return NextResponse.json({
        success: true,
        message: 'Demo data seeded successfully',
        comprehensive: !!comprehensive,
        ...result,
      })
    }
    
    // Otherwise, show instructions
    return NextResponse.json({
      message: 'Demo Data Seeding Endpoint',
      instructions: [
        'To seed demo data, use one of these methods:',
        '1. Basic seed: Visit /api/admin/seed-demo-data?trigger=true',
        '2. Comprehensive seed (150+ contacts, 200+ deals): Visit /api/admin/seed-demo-data?trigger=true&comprehensive=true',
        '3. Background seed: Add ?background=true to run without timeout',
        '4. Use POST request: curl -X POST https://payaid-v3.vercel.app/api/admin/seed-demo-data?comprehensive=true',
        '5. Use browser console: fetch("/api/admin/seed-demo-data?comprehensive=true", {method: "POST"})',
      ],
      quickSeed: 'Visit: /api/admin/seed-demo-data?trigger=true&comprehensive=true',
      comprehensiveSeed: 'Visit: /api/admin/seed-demo-data?trigger=true&comprehensive=true&background=true',
      note: 'Comprehensive seed creates 150+ contacts, 200+ deals, 300+ tasks, and data across all modules (Mar 2025 - Feb 2026).',
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error: any) {
    console.error('[SEED_DEMO_DATA] GET Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to seed demo data',
        message: error?.message,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/seed-demo-data
 * Seeds comprehensive sample data for the demo tenant
 * This endpoint should be protected in production
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  try {
    // Add basic authentication check - but allow if user is authenticated via session
    const authHeader = request.headers.get('authorization')
    
    // Try to authenticate via session if no auth header
    let isAuthenticated = !!authHeader
    let user = null
    if (!authHeader) {
      try {
        const { authenticateRequest } = await import('@/lib/middleware/auth')
        user = await authenticateRequest(request).catch(() => null)
        isAuthenticated = !!user
      } catch (authError) {
        // If auth fails, check if we're in development
        isAuthenticated = process.env.NODE_ENV !== 'production'
        console.warn('[SEED_DEMO_DATA] Auth check failed, allowing in dev mode:', authError)
      }
    }
    
    // Only require auth in production
    if (!isAuthenticated && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required. Please log in first or provide Authorization header.' },
        { status: 401 }
      )
    }

    // Check if background mode is requested
    const searchParams = request.nextUrl.searchParams
    const background = searchParams.get('background') === 'true'
    let targetTenantId = searchParams.get('tenantId') // Allow specifying tenant ID
    const comprehensive = searchParams.get('comprehensive') === 'true' // Use comprehensive seed
    
    // Use authenticated user's tenantId if no tenantId specified
    if (!targetTenantId && user?.tenantId) {
      targetTenantId = user.tenantId
    }

    if (background) {
      // Determine tenant ID for seed operation - ALWAYS find tenant before starting seed
      let seedTenantId = targetTenantId
      
      // If no tenantId provided, find it from user or Demo Business
      if (!seedTenantId) {
        if (user?.tenantId) {
          seedTenantId = user.tenantId
        } else {
          // Find Demo Business tenant
          try {
            const demoTenant = await prisma.tenant.findFirst({
              where: { name: { contains: 'Demo Business', mode: 'insensitive' } },
            })
            if (demoTenant) {
              seedTenantId = demoTenant.id
            }
          } catch (findError) {
            console.error('[SEED_DEMO_DATA] Failed to find tenant:', findError)
          }
        }
      }
      
      // If still no tenantId, we can't proceed
      if (!seedTenantId) {
        return NextResponse.json(
          {
            error: 'No tenant found',
            message: 'Could not determine tenant ID. Please provide tenantId parameter or ensure you are logged in.',
          },
          { status: 400 }
        )
      }
      
      // Check if seed is already running for this tenant
      const seedStatus = isSeedRunning(seedTenantId)
      if (seedStatus.running && seedStatus.elapsed) {
        const elapsedSeconds = Math.floor(seedStatus.elapsed / 1000)
        return NextResponse.json({
          success: true,
          message: `Seed operation already in progress for this tenant. Started ${elapsedSeconds} seconds ago. Please wait for it to complete.`,
          background: true,
          comprehensive: !!comprehensive,
          tenantId: seedTenantId,
          alreadyRunning: true,
          elapsedSeconds,
        })
      }
      
      // Start seeding in background and return immediately
      const seedPromise = (async () => {
        try {
          console.log(`[SEED_DEMO_DATA] Starting ${comprehensive ? 'comprehensive' : 'basic'} seed for tenant: ${seedTenantId}`)
          
          if (comprehensive) {
            await seedDemoBusiness(seedTenantId)
          } else {
            await seedDemoDataForTenant(seedTenantId)
          }
          
          // Verify data was created
          const [contacts, deals, tasks] = await Promise.all([
            prisma.contact.count({ where: { tenantId: seedTenantId } }).catch(() => 0),
            prisma.deal.count({ where: { tenantId: seedTenantId } }).catch(() => 0),
            prisma.task.count({ where: { tenantId: seedTenantId } }).catch(() => 0),
          ])
          
          console.log(`[SEED_DEMO_DATA] Seed completed. Created: ${contacts} contacts, ${deals} deals, ${tasks} tasks`)
          
          if (contacts === 0 && deals === 0 && tasks === 0) {
            console.warn(`[SEED_DEMO_DATA] WARNING: Seed completed but no data was created for tenant ${seedTenantId}`)
          }
        } catch (err: any) {
          console.error('[SEED_DEMO_DATA] Background seed error:', err)
          console.error('[SEED_DEMO_DATA] Error details:', err?.message, err?.stack)
          throw err
        } finally {
          // Clean up tracking after seed completes or fails
          stopSeedTracking(seedTenantId)
        }
      })()
      
      // Track ongoing seed
      startSeedTracking(seedTenantId, seedPromise)
      
      // Don't await - let it run in background
      seedPromise.catch((err) => {
        console.error('[SEED_DEMO_DATA] Seed promise rejected:', err)
      })
      
      return NextResponse.json({
        success: true,
        message: `Seed operation started in background for tenant ${seedTenantId}. This may take 30-60 seconds. Please refresh the page in a minute.`,
        background: true,
        comprehensive: !!comprehensive,
        tenantId: seedTenantId,
      })
    }

    // Add timeout wrapper for Vercel Hobby plan (10s limit)
    const SEED_TIMEOUT = 8500 // 8.5 seconds (leave 1.5s buffer for Vercel)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Seed operation timed out. The seed process takes longer than 10 seconds on Vercel Hobby plan. Please use ?background=true parameter or upgrade to Pro plan.'))
      }, SEED_TIMEOUT)
    })

    // Use comprehensive seed if requested
    let seedPromise: Promise<any>
    if (comprehensive) {
      if (targetTenantId) {
        seedPromise = seedDemoBusiness(targetTenantId)
      } else {
        // Find Demo Business tenant
        const demoTenant = await prisma.tenant.findFirst({
          where: { name: { contains: 'Demo Business', mode: 'insensitive' } },
        })
        if (demoTenant) {
          seedPromise = seedDemoBusiness(demoTenant.id)
        } else {
          seedPromise = seedDemoData()
        }
      }
    } else {
      seedPromise = targetTenantId ? seedDemoDataForTenant(targetTenantId) : seedDemoData()
    }

    const result = await Promise.race([
      seedPromise,
      timeoutPromise,
    ]) as any

    const duration = Date.now() - startTime
    console.log(`[SEED_DEMO_DATA] Completed in ${duration}ms`)
    
    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      duration: `${duration}ms`,
      ...result,
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('[SEED_DEMO_DATA] POST Error:', error)
    console.error('[SEED_DEMO_DATA] Error stack:', error?.stack)
    console.error(`[SEED_DEMO_DATA] Failed after ${duration}ms`)
    
    // Check if it's a timeout error
    const isTimeout = error?.message?.includes('timeout') || duration >= 8500
    
    return NextResponse.json(
      {
        error: 'Failed to seed demo data',
        message: error?.message || 'Unknown error occurred',
        isTimeout,
        duration: `${duration}ms`,
        suggestion: isTimeout 
          ? 'The seed operation timed out. Try using ?background=true parameter or upgrade to Vercel Pro plan for longer execution times.'
          : 'Please check the server logs for more details.',
        backgroundOption: 'You can use POST /api/admin/seed-demo-data?background=true to run in background',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * Seed data for a specific tenant ID (without recreating tenant)
 */
async function seedDemoDataForTenant(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  })
  
  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`)
  }
  
  console.log(`[SEED_DEMO_DATA] Seeding for specific tenant: ${tenant.name} (${tenantId})`)
  
  // Use the existing seed logic but skip tenant creation
  return seedDemoDataInternal(tenantId, tenant)
}

/**
 * Shared seeding logic
 */
async function seedDemoData() {
  try {
    // Don't disconnect Prisma - it's managed globally and disconnecting can cause issues
    // The connection pool will handle connections automatically
    console.log('[SEED_DEMO_DATA] Starting seed process...')

    // Get or create demo tenant with personalized ID
    let tenant = await prisma.tenant.findFirst({
      where: { subdomain: 'demo' },
    })

    const businessName = 'Demo Business Pvt Ltd'
    const expectedPrefix = businessName.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)
    
    // Check if existing tenant has personalized ID format
    const hasPersonalizedId = tenant ? (tenant.id.startsWith(expectedPrefix) && tenant.id.includes('-')) : false
    
    if (!tenant || !hasPersonalizedId) {
      // If tenant exists but doesn't have personalized ID, delete it first
      if (tenant) {
        console.log(`⚠️  Existing demo tenant has non-personalized ID: ${tenant.id}`)
        console.log(`   Deleting and recreating with personalized ID...`)
        
        // Delete all related data first (cascade should handle most, but be explicit for safety)
        const tenantIdToDelete = tenant.id
        
        // Delete in transaction to ensure clean deletion
        // IMPORTANT: Don't delete admin@demo.com user - we'll update its tenantId instead
        await prisma.$transaction(async (tx) => {
          // Update admin user's tenantId to null temporarily (we'll set it to new tenant later)
          await tx.user.updateMany({
            where: { 
              email: 'admin@demo.com',
              tenantId: tenantIdToDelete 
            },
            data: { tenantId: null } // Temporarily set to null to break foreign key
          })
          
          // Delete other users (not admin@demo.com)
          await tx.user.deleteMany({ 
            where: { 
              tenantId: tenantIdToDelete,
              email: { not: 'admin@demo.com' }
            } 
          })
          
          // Delete tenant (cascade will handle related records)
          await tx.tenant.delete({ where: { id: tenantIdToDelete } })
        })
        
        console.log(`   ✅ Deleted old tenant (preserved admin user)`)
      }
      
      // Generate personalized tenant ID from business name
      const existingTenants = await prisma.tenant.findMany({
        select: { id: true },
      })
      const existingIds = existingTenants.map(t => t.id)
      const personalizedTenantId = generateTenantId(businessName, existingIds)

      // Create demo tenant with personalized ID
      tenant = await prisma.tenant.create({
        data: {
          id: personalizedTenantId, // Use personalized ID instead of default CUID
          name: businessName,
          subdomain: 'demo',
          plan: 'professional',
          status: 'active',
          maxContacts: 1000,
          maxInvoices: 1000,
          maxUsers: 10,
          maxStorage: 10240,
          gstin: '29ABCDE1234F1Z5',
          address: '123 Business Park, MG Road',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
          phone: '+91-80-12345678',
          email: 'contact@demobusiness.com',
          website: 'https://demobusiness.com',
        },
      })
      console.log(`✅ Created demo tenant with personalized ID: ${tenant.id}`)
    } else {
      console.log(`✅ Using existing demo tenant with personalized ID: ${tenant.id}`)
    }

    const tenantId = tenant.id
    console.log(`🌱 Seeding sample data for tenant: ${tenant.name} (${tenantId})`)

    // Get current date for all date calculations
    const now = new Date()

    // Hash password for admin user
    const hashedPassword = await bcrypt.hash('Test@1234', 10)

    // Ensure admin user exists - CRITICAL: Update tenantId if tenant was recreated
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {
        password: hashedPassword,
        tenantId: tenantId, // Always update tenantId in case tenant was recreated
      },
      create: {
        email: 'admin@demo.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'owner',
        tenantId: tenantId,
      },
    })
    
    // Double-check: If user exists but has wrong tenantId, fix it
    if (adminUser.tenantId !== tenantId) {
      console.log(`⚠️  Admin user has wrong tenantId (${adminUser.tenantId}), updating to ${tenantId}...`)
      await prisma.user.update({
        where: { email: 'admin@demo.com' },
        data: {
          tenantId: tenantId,
          password: hashedPassword, // Also reset password
        },
      })
      console.log(`✅ Fixed admin user tenantId`)
    }

    // Lead source names for assignment
    const sourceNames = [
      'Google Search',
      'Facebook Ads',
      'LinkedIn',
      'Referral',
      'Website Form',
      'Email Campaign',
      'Trade Show',
      'Cold Call',
      'YouTube Ads',
      'Partner Channel',
    ]

    // Create sample contacts (50+ contacts with proper stage distribution)
    const contactNames = [
      // Customers (stage='customer') - 15 contacts
      { name: 'John Doe', email: 'john@example.com', phone: '+91-9876543210', stage: 'customer', company: 'Tech Solutions Inc', leadScore: 85 },
      { name: 'Jane Smith', email: 'jane@example.com', phone: '+91-9876543211', stage: 'customer', company: 'Digital Marketing Pro', leadScore: 90 },
      { name: 'Acme Corporation', email: 'contact@acme.com', phone: '+91-22-12345678', stage: 'customer', company: 'Acme Corporation', leadScore: 88 },
      { name: 'Vikram Singh', email: 'vikram@corp.com', phone: '+91-9876543216', stage: 'customer', company: 'Corporate Ventures', leadScore: 82 },
      { name: 'Meera Nair', email: 'meera@digital.com', phone: '+91-9876543219', stage: 'customer', company: 'Digital Solutions', leadScore: 87 },
      { name: 'Client Services Inc', email: 'contact@clientservices.com', phone: '+91-9876543220', stage: 'customer', company: 'Client Services Inc', leadScore: 91 },
      { name: 'Partner Network', email: 'hello@partnernetwork.com', phone: '+91-9876543221', stage: 'customer', company: 'Partner Network', leadScore: 89 },
      { name: 'Customer First Ltd', email: 'hello@customerfirst.com', phone: '+91-9876543225', stage: 'customer', company: 'Customer First Ltd', leadScore: 86 },
      { name: 'Global Solutions', email: 'contact@globalsolutions.com', phone: '+91-9876543227', stage: 'customer', company: 'Global Solutions', leadScore: 92 },
      { name: 'Premium Services Co', email: 'contact@premiumservices.com', phone: '+91-9876543228', stage: 'customer', company: 'Premium Services Co', leadScore: 84 },
      { name: 'Enterprise Solutions Ltd', email: 'info@enterprisesolutions.com', phone: '+91-9876543229', stage: 'customer', company: 'Enterprise Solutions Ltd', leadScore: 88 },
      { name: 'Strategic Partners Inc', email: 'hello@strategicpartners.com', phone: '+91-9876543230', stage: 'customer', company: 'Strategic Partners Inc', leadScore: 90 },
      { name: 'Business Excellence Group', email: 'contact@businessexcellence.com', phone: '+91-9876543231', stage: 'customer', company: 'Business Excellence Group', leadScore: 85 },
      { name: 'Innovation Hub', email: 'info@innovationhub.com', phone: '+91-9876543232', stage: 'customer', company: 'Innovation Hub', leadScore: 87 },
      { name: 'Growth Partners', email: 'hello@growthpartners.com', phone: '+91-9876543233', stage: 'customer', company: 'Growth Partners', leadScore: 89 },
      
      // Contacts (stage='contact') - 15 contacts
      { name: 'Rajesh Kumar', email: 'rajesh@startup.com', phone: '+91-9876543212', stage: 'contact', company: 'StartupXYZ', leadScore: 65 },
      { name: 'Priya Sharma', email: 'priya@enterprise.com', phone: '+91-9876543213', stage: 'contact', company: 'Enterprise Solutions', leadScore: 70 },
      { name: 'Amit Patel', email: 'amit@tech.com', phone: '+91-9876543214', stage: 'contact', company: 'Tech Innovations', leadScore: 68 },
      { name: 'Sneha Reddy', email: 'sneha@business.com', phone: '+91-9876543215', stage: 'contact', company: 'Business Growth Co', leadScore: 72 },
      { name: 'Anjali Mehta', email: 'anjali@services.com', phone: '+91-9876543217', stage: 'contact', company: 'Professional Services Ltd', leadScore: 66 },
      { name: 'Rahul Gupta', email: 'rahul@consulting.com', phone: '+91-9876543218', stage: 'contact', company: 'Consulting Group', leadScore: 69 },
      { name: 'Prospect Industries', email: 'info@prospect.com', phone: '+91-22-87654321', stage: 'contact', company: 'Prospect Industries', leadScore: 71 },
      { name: 'Hot Lead Corp', email: 'sales@hotlead.com', phone: '+91-9876543222', stage: 'contact', company: 'Hot Lead Corp', leadScore: 67 },
      { name: 'New Lead Solutions', email: 'info@newlead.com', phone: '+91-9876543223', stage: 'contact', company: 'New Lead Solutions', leadScore: 64 },
      { name: 'Big Deal Enterprises', email: 'contact@bigdeal.com', phone: '+91-9876543224', stage: 'contact', company: 'Big Deal Enterprises', leadScore: 73 },
      { name: 'Enterprise Group', email: 'info@enterprisegroup.com', phone: '+91-9876543226', stage: 'contact', company: 'Enterprise Group', leadScore: 70 },
      { name: 'Tech Startups Inc', email: 'hello@techstartups.com', phone: '+91-9876543234', stage: 'contact', company: 'Tech Startups Inc', leadScore: 68 },
      { name: 'Digital Ventures', email: 'contact@digitalventures.com', phone: '+91-9876543235', stage: 'contact', company: 'Digital Ventures', leadScore: 65 },
      { name: 'Cloud Solutions Co', email: 'info@cloudsolutions.com', phone: '+91-9876543236', stage: 'contact', company: 'Cloud Solutions Co', leadScore: 69 },
      { name: 'Data Analytics Ltd', email: 'hello@dataanalytics.com', phone: '+91-9876543237', stage: 'contact', company: 'Data Analytics Ltd', leadScore: 71 },
      
      // Prospects (stage='prospect') - 20 contacts with high lead scores for Sales Automation
      { name: 'AI Tech Solutions', email: 'contact@aitech.com', phone: '+91-9876543238', stage: 'prospect', company: 'AI Tech Solutions', leadScore: 75 },
      { name: 'Blockchain Innovations', email: 'info@blockchain.com', phone: '+91-9876543239', stage: 'prospect', company: 'Blockchain Innovations', leadScore: 78 },
      { name: 'Cybersecurity Pro', email: 'hello@cybersecurity.com', phone: '+91-9876543240', stage: 'prospect', company: 'Cybersecurity Pro', leadScore: 72 },
      { name: 'FinTech Solutions', email: 'contact@fintech.com', phone: '+91-9876543241', stage: 'prospect', company: 'FinTech Solutions', leadScore: 80 },
      { name: 'Healthcare Tech', email: 'info@healthcaretech.com', phone: '+91-9876543242', stage: 'prospect', company: 'Healthcare Tech', leadScore: 76 },
      { name: 'EdTech Platform', email: 'hello@edtech.com', phone: '+91-9876543243', stage: 'prospect', company: 'EdTech Platform', leadScore: 74 },
      { name: 'E-commerce Solutions', email: 'contact@ecommerce.com', phone: '+91-9876543244', stage: 'prospect', company: 'E-commerce Solutions', leadScore: 77 },
      { name: 'SaaS Platform Inc', email: 'info@saasplatform.com', phone: '+91-9876543245', stage: 'prospect', company: 'SaaS Platform Inc', leadScore: 79 },
      { name: 'Mobile App Dev', email: 'hello@mobileapp.com', phone: '+91-9876543246', stage: 'prospect', company: 'Mobile App Dev', leadScore: 73 },
      { name: 'Web Development Co', email: 'contact@webdev.com', phone: '+91-9876543247', stage: 'prospect', company: 'Web Development Co', leadScore: 75 },
      { name: 'IT Consulting Group', email: 'info@itconsulting.com', phone: '+91-9876543248', stage: 'prospect', company: 'IT Consulting Group', leadScore: 78 },
      { name: 'Software Services', email: 'hello@softwareservices.com', phone: '+91-9876543249', stage: 'prospect', company: 'Software Services', leadScore: 76 },
      { name: 'Cloud Infrastructure', email: 'contact@cloudinfra.com', phone: '+91-9876543250', stage: 'prospect', company: 'Cloud Infrastructure', leadScore: 81 },
      { name: 'Data Science Labs', email: 'info@datascience.com', phone: '+91-9876543251', stage: 'prospect', company: 'Data Science Labs', leadScore: 74 },
      { name: 'Machine Learning Co', email: 'hello@mlcompany.com', phone: '+91-9876543252', stage: 'prospect', company: 'Machine Learning Co', leadScore: 77 },
      { name: 'IoT Solutions', email: 'contact@iotsolutions.com', phone: '+91-9876543253', stage: 'prospect', company: 'IoT Solutions', leadScore: 75 },
      { name: 'Automation Systems', email: 'info@automation.com', phone: '+91-9876543254', stage: 'prospect', company: 'Automation Systems', leadScore: 79 },
      { name: 'DevOps Services', email: 'hello@devops.com', phone: '+91-9876543255', stage: 'prospect', company: 'DevOps Services', leadScore: 76 },
      { name: 'Quality Assurance Co', email: 'contact@qacompany.com', phone: '+91-9876543256', stage: 'prospect', company: 'Quality Assurance Co', leadScore: 73 },
      { name: 'UI/UX Design Studio', email: 'info@uidesign.com', phone: '+91-9876543257', stage: 'prospect', company: 'UI/UX Design Studio', leadScore: 78 },
    ]

    // Check existing contacts count - only delete if we need to recreate for proper stage distribution
    const existingContactsCount = await prisma.contact.count({ where: { tenantId } })
    const existingContacts = await prisma.contact.findMany({ 
      where: { tenantId },
      select: { id: true, stage: true, name: true }
    })
    
    // Only delete if we have fewer than 30 contacts or missing stage distribution
    const hasProperDistribution = existingContacts.filter(c => c.stage === 'customer').length >= 10 &&
                                  existingContacts.filter(c => c.stage === 'contact').length >= 10 &&
                                  existingContacts.filter(c => c.stage === 'prospect').length >= 10
    
    if (existingContactsCount < 30 || !hasProperDistribution) {
      console.log(`[SEED] Recreating contacts for proper distribution (existing: ${existingContactsCount})`)
      await prisma.contact.deleteMany({ where: { tenantId } })
    } else {
      console.log(`[SEED] Preserving existing ${existingContactsCount} contacts`)
    }
    
    // Create contacts in batches to avoid connection pool exhaustion
    const contacts: any[] = []
    const BATCH_SIZE = 3 // Process 3 contacts at a time (reduced to avoid pool exhaustion)
    
    // Get existing contacts to preserve them
    const existingContactEmails = new Set(existingContacts.map(c => {
      // Try to find email from existing contacts
      return null // We'll check by name instead
    }))
    
    // Create new contacts only if we deleted old ones, otherwise use existing
    if (existingContactsCount < 30 || !hasProperDistribution) {
      for (let i = 0; i < contactNames.length; i += BATCH_SIZE) {
        const batch = contactNames.slice(i, i + BATCH_SIZE)
        const batchContacts = await Promise.all(
          batch.map((contact, batchIdx) => {
            const idx = i + batchIdx
            // Spread contacts across last 12 months including Q4 (Jan-Mar 2026) for better quarterly data
            let createdAt: Date
            if (idx < 8) {
              // First 8 contacts in Q4 (Jan-Mar 2026) - More leads for Q4
              const monthInQ4 = idx % 3 // 0=Jan, 1=Feb, 2=Mar
              const dayInMonth = Math.min((idx % 28) + 1, 28)
              createdAt = new Date(2026, monthInQ4, dayInMonth) // Q4 2026 (Jan-Mar)
            } else {
              // Rest spread across last 12 months (from current month backwards)
              const monthsAgo = (idx - 8) % 12
              createdAt = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1 + (idx % 28))
            }
            
            return prisma.contact.create({
              data: {
                tenantId,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                company: contact.company,
                type: contact.stage === 'customer' ? 'customer' : contact.stage === 'contact' ? 'lead' : 'lead', // Keep type for backward compatibility
                stage: contact.stage, // Use stage field (prospect, contact, customer)
                status: 'active',
                country: 'India',
                city: 'Bangalore',
                state: 'Karnataka',
                postalCode: '560001',
                address: `${contact.company}, Bangalore`,
                source: sourceNames[idx % sourceNames.length],
                leadScore: contact.leadScore || 0,
                lastContactedAt: contact.stage === 'customer' ? new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : null, // Customers have recent activity
                createdAt,
              },
            })
          })
        )
        contacts.push(...batchContacts)
        // Delay between batches to allow connections to be released
        if (i + BATCH_SIZE < contactNames.length) {
          await new Promise(resolve => setTimeout(resolve, 200)) // Increased delay
        }
      }
    } else {
      // Use existing contacts
      console.log(`[SEED] Using existing ${existingContacts.length} contacts`)
      contacts.push(...existingContacts)
      
      // Still create additional contacts if we have fewer than 50
      if (existingContactsCount < 50) {
        const additionalContactsNeeded = 50 - existingContactsCount
        const additionalContactNames = contactNames.slice(existingContactsCount)
        
        for (let i = 0; i < Math.min(additionalContactsNeeded, additionalContactNames.length); i += BATCH_SIZE) {
          const batch = additionalContactNames.slice(i, i + BATCH_SIZE)
          const batchContacts = await Promise.all(
            batch.map((contact, batchIdx) => {
              const idx = existingContactsCount + i + batchIdx
              const monthsAgo = idx % 12
              const createdAt = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1 + (idx % 28))
              
              return prisma.contact.create({
                data: {
                  tenantId,
                  name: contact.name,
                  email: contact.email,
                  phone: contact.phone,
                  company: contact.company,
                  type: contact.stage === 'customer' ? 'customer' : contact.stage === 'contact' ? 'lead' : 'lead',
                  stage: contact.stage,
                  status: 'active',
                  country: 'India',
                  city: 'Bangalore',
                  state: 'Karnataka',
                  postalCode: '560001',
                  address: `${contact.company}, Bangalore`,
                  source: sourceNames[idx % sourceNames.length],
                  leadScore: contact.leadScore || 0,
                  lastContactedAt: contact.stage === 'customer' ? new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : null,
                  createdAt,
                },
              })
            })
          )
          contacts.push(...batchContacts)
          if (i + BATCH_SIZE < Math.min(additionalContactsNeeded, additionalContactNames.length)) {
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        }
      }
    }

    // ENHANCEMENT: Create additional contacts to reach 2000+ CRM records target
    // Target: 800 contacts (to reach 2000+ total with deals, tasks, meetings)
    const TARGET_CONTACTS = 800
    const additionalContactsNeeded = Math.max(0, TARGET_CONTACTS - contacts.length)
    
    if (additionalContactsNeeded > 0) {
      console.log(`[SEED] Creating ${additionalContactsNeeded} additional contacts to reach target...`)
      const companies = ['Tech', 'Solutions', 'Services', 'Group', 'Corp', 'Ltd', 'Inc', 'Systems', 'Digital', 'Global']
      const firstNames = ['Raj', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Meera', 'Rahul', 'Anjali', 'Arjun', 'Kavya', 'Rohan', 'Divya', 'Suresh', 'Lakshmi', 'Kiran']
      const lastNames = ['Kumar', 'Sharma', 'Patel', 'Reddy', 'Singh', 'Nair', 'Gupta', 'Mehta', 'Iyer', 'Rao', 'Joshi', 'Malhotra', 'Agarwal', 'Verma', 'Shah']
      const stages = ['prospect', 'contact', 'customer'] as const
      
      for (let i = 0; i < additionalContactsNeeded; i += BATCH_SIZE) {
        const batch = Array.from({ length: Math.min(BATCH_SIZE, additionalContactsNeeded - i) }, (_, idx) => {
          const globalIdx = contacts.length + i + idx
          const firstName = firstNames[globalIdx % firstNames.length]
          const lastName = lastNames[globalIdx % lastNames.length]
          const company = companies[globalIdx % companies.length]
          const stage = stages[globalIdx % stages.length]
          
          return {
            name: `${firstName} ${lastName}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${globalIdx}@${company.toLowerCase()}.com`,
            phone: `+91-987654${String(globalIdx % 10000).padStart(4, '0')}`,
            stage,
            company: `${company} ${globalIdx % 100}`,
            leadScore: 50 + (globalIdx % 50),
          }
        })
        
        const batchContacts = await Promise.all(
          batch.map((contact, batchIdx) => {
            const globalIdx = contacts.length + i + batchIdx
            const monthsAgo = globalIdx % 24 // Spread across 24 months
            const createdAt = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1 + (globalIdx % 28))
            
            return prisma.contact.create({
              data: {
                tenantId,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                company: contact.company,
                type: contact.stage === 'customer' ? 'customer' : 'lead',
                stage: contact.stage,
                status: 'active',
                country: 'India',
                city: 'Bangalore',
                state: 'Karnataka',
                postalCode: '560001',
                address: `${contact.company}, Bangalore`,
                source: sourceNames[globalIdx % sourceNames.length],
                leadScore: contact.leadScore,
                lastContactedAt: contact.stage === 'customer' ? new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : null,
                createdAt,
              },
            })
          })
        )
        contacts.push(...batchContacts)
        
        if (i + BATCH_SIZE < additionalContactsNeeded) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      console.log(`[SEED] Created ${additionalContactsNeeded} additional contacts`)
    }
    
    console.log(`✅ Total contacts: ${contacts.length} (${existingContactsCount < 30 ? 'created new' : 'preserved existing and added more'})`)

    // Calculate financial year quarters (Indian FY: Apr-Mar)
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed
    const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1 // FY starts in April (month 3)
    const fyEndYear = fyStartYear + 1
    
    // Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
    const q1Start = new Date(fyStartYear, 3, 1) // April 1
    const q1End = new Date(fyStartYear, 5, 30) // June 30
    const q2Start = new Date(fyStartYear, 6, 1) // July 1
    const q2End = new Date(fyStartYear, 8, 30) // September 30
    const q3Start = new Date(fyStartYear, 9, 1) // October 1
    const q3End = new Date(fyStartYear, 11, 31) // December 31
    const q4Start = new Date(fyEndYear, 0, 1) // January 1
    const q4End = new Date(fyEndYear, 2, 31) // March 31
    
    // Create sample deals (30+ deals with various stages and quarters)
    const dealsData = [
      // Q1 Deals (Apr-Jun)
      { name: 'Q1 - Tech Solutions Enterprise Deal', value: 150000, stage: 'won', probability: 100, contactIdx: 0, quarter: 'q1' },
      { name: 'Q1 - Digital Marketing Annual Contract', value: 120000, stage: 'won', probability: 100, contactIdx: 1, quarter: 'q1' },
      { name: 'Q1 - Acme Corporation Expansion', value: 200000, stage: 'won', probability: 100, contactIdx: 2, quarter: 'q1' },
      { name: 'Q1 - StartupXYZ Series A Support', value: 80000, stage: 'won', probability: 100, contactIdx: 3, quarter: 'q1' },
      { name: 'Q1 - Enterprise Solutions Partnership', value: 300000, stage: 'won', probability: 100, contactIdx: 4, quarter: 'q1' },
      
      // Q2 Deals (Jul-Sep)
      { name: 'Q2 - Tech Innovations Platform', value: 180000, stage: 'won', probability: 100, contactIdx: 5, quarter: 'q2' },
      { name: 'Q2 - Business Growth Co Strategy', value: 95000, stage: 'won', probability: 100, contactIdx: 6, quarter: 'q2' },
      { name: 'Q2 - Corporate Ventures Deal', value: 220000, stage: 'won', probability: 100, contactIdx: 7, quarter: 'q2' },
      { name: 'Q2 - Professional Services Contract', value: 110000, stage: 'won', probability: 100, contactIdx: 8, quarter: 'q2' },
      { name: 'Q2 - Consulting Group Engagement', value: 140000, stage: 'won', probability: 100, contactIdx: 9, quarter: 'q2' },
      
      // Q3 Deals (Oct-Dec)
      { name: 'Q3 - Digital Solutions Upgrade', value: 75000, stage: 'won', probability: 100, contactIdx: 10, quarter: 'q3' },
      { name: 'Q3 - Prospect Industries Deal', value: 160000, stage: 'won', probability: 100, contactIdx: 11, quarter: 'q3' },
      { name: 'Q3 - Client Services Expansion', value: 190000, stage: 'won', probability: 100, contactIdx: 12, quarter: 'q3' },
      { name: 'Q3 - Partner Network Collaboration', value: 130000, stage: 'won', probability: 100, contactIdx: 13, quarter: 'q3' },
      { name: 'Q3 - Hot Lead Corp Opportunity', value: 170000, stage: 'won', probability: 100, contactIdx: 14, quarter: 'q3' },
      
      // Q4 Deals (Jan-Mar) - IMPORTANT: These should show in charts - Added more deals for better data
      { name: 'Q4 - New Lead Solutions Deal', value: 100000, stage: 'won', probability: 100, contactIdx: 15, quarter: 'q4' },
      { name: 'Q4 - Big Deal Enterprises Contract', value: 250000, stage: 'won', probability: 100, contactIdx: 16, quarter: 'q4' },
      { name: 'Q4 - Customer First Partnership', value: 145000, stage: 'won', probability: 100, contactIdx: 17, quarter: 'q4' },
      { name: 'Q4 - Enterprise Group Deal', value: 300000, stage: 'won', probability: 100, contactIdx: 18, quarter: 'q4' },
      { name: 'Q4 - Global Solutions Contract', value: 180000, stage: 'won', probability: 100, contactIdx: 19, quarter: 'q4' },
      { name: 'Q4 - Premium Services Agreement', value: 220000, stage: 'won', probability: 100, contactIdx: 0, quarter: 'q4' },
      { name: 'Q4 - Strategic Partnership Deal', value: 175000, stage: 'won', probability: 100, contactIdx: 1, quarter: 'q4' },
      { name: 'Q4 - Technology Integration Contract', value: 195000, stage: 'won', probability: 100, contactIdx: 2, quarter: 'q4' },
      { name: 'Q4 - Business Expansion Project', value: 280000, stage: 'won', probability: 100, contactIdx: 3, quarter: 'q4' },
      { name: 'Q4 - Enterprise Software License', value: 160000, stage: 'won', probability: 100, contactIdx: 4, quarter: 'q4' },
      { name: 'Q4 - Digital Transformation Deal', value: 240000, stage: 'won', probability: 100, contactIdx: 5, quarter: 'q4' },
      { name: 'Q4 - Cloud Services Agreement', value: 135000, stage: 'won', probability: 100, contactIdx: 6, quarter: 'q4' },
      { name: 'Q4 - Consulting Services Contract', value: 185000, stage: 'won', probability: 100, contactIdx: 7, quarter: 'q4' },
      { name: 'Q4 - Support & Maintenance Deal', value: 125000, stage: 'won', probability: 100, contactIdx: 8, quarter: 'q4' },
      { name: 'Q4 - Annual Subscription Renewal', value: 210000, stage: 'won', probability: 100, contactIdx: 9, quarter: 'q4' },
      { name: 'Q4 - Custom Development Project', value: 275000, stage: 'won', probability: 100, contactIdx: 10, quarter: 'q4' },
      { name: 'Q4 - Data Analytics Platform', value: 155000, stage: 'won', probability: 100, contactIdx: 11, quarter: 'q4' },
      { name: 'Q4 - Security & Compliance Package', value: 190000, stage: 'won', probability: 100, contactIdx: 12, quarter: 'q4' },
      { name: 'Q4 - Training & Certification Deal', value: 110000, stage: 'won', probability: 100, contactIdx: 13, quarter: 'q4' },
      { name: 'Q4 - Integration Services Contract', value: 165000, stage: 'won', probability: 100, contactIdx: 14, quarter: 'q4' },
      
      // Active deals created this month (for "Deals Created This Month" stat)
      { name: 'Current Month - Active Deal 1', value: 150000, stage: 'proposal', probability: 60, contactIdx: 0, quarter: 'current' },
      { name: 'Current Month - Active Deal 2', value: 120000, stage: 'negotiation', probability: 75, contactIdx: 1, quarter: 'current' },
      { name: 'Current Month - Active Deal 3', value: 200000, stage: 'qualified', probability: 50, contactIdx: 2, quarter: 'current' },
      { name: 'Current Month - Active Deal 4', value: 80000, stage: 'proposal', probability: 65, contactIdx: 3, quarter: 'current' },
      { name: 'Current Month - Active Deal 5', value: 300000, stage: 'negotiation', probability: 80, contactIdx: 4, quarter: 'current' },
      { name: 'Current Month - Active Deal 6', value: 180000, stage: 'qualified', probability: 55, contactIdx: 5, quarter: 'current' },
      { name: 'Current Month - Active Deal 7', value: 95000, stage: 'proposal', probability: 70, contactIdx: 6, quarter: 'current' },
      { name: 'Current Month - Active Deal 8', value: 220000, stage: 'negotiation', probability: 75, contactIdx: 7, quarter: 'current' },
      { name: 'Current Month - Active Deal 9', value: 110000, stage: 'qualified', probability: 60, contactIdx: 8, quarter: 'current' },
      { name: 'Current Month - Active Deal 10', value: 140000, stage: 'proposal', probability: 65, contactIdx: 9, quarter: 'current' },
      { name: 'Current Month - Active Deal 11', value: 75000, stage: 'qualified', probability: 50, contactIdx: 10, quarter: 'current' },
      { name: 'Current Month - Active Deal 12', value: 160000, stage: 'proposal', probability: 70, contactIdx: 11, quarter: 'current' },
      
      // Won deals created this month (for "Revenue This Month" stat)
      { name: 'Won This Month - Customer First Ltd', value: 150000, stage: 'won', probability: 100, contactIdx: 17, quarter: 'current' },
      { name: 'Won This Month - Partner Network', value: 85000, stage: 'won', probability: 100, contactIdx: 13, quarter: 'current' },
      { name: 'Won This Month - Client Services Inc', value: 200000, stage: 'won', probability: 100, contactIdx: 12, quarter: 'current' },
      { name: 'Won This Month - Digital Marketing Pro', value: 120000, stage: 'won', probability: 100, contactIdx: 1, quarter: 'current' },
      { name: 'Won This Month - Enterprise Solutions', value: 95000, stage: 'won', probability: 100, contactIdx: 4, quarter: 'current' },
      
      // Deals closing this month (for "Deals Closing This Month" stat)
      { name: 'Closing This Month - Deal 1', value: 180000, stage: 'negotiation', probability: 85, contactIdx: 5, quarter: 'current' },
      { name: 'Closing This Month - Deal 2', value: 220000, stage: 'negotiation', probability: 90, contactIdx: 7, quarter: 'current' },
      { name: 'Closing This Month - Deal 3', value: 160000, stage: 'proposal', probability: 80, contactIdx: 11, quarter: 'current' },
      { name: 'Closing This Month - Deal 4', value: 190000, stage: 'negotiation', probability: 85, contactIdx: 12, quarter: 'current' },
      { name: 'Closing This Month - Deal 5', value: 250000, stage: 'negotiation', probability: 90, contactIdx: 16, quarter: 'current' },
      { name: 'Closing This Month - Deal 6', value: 145000, stage: 'proposal', probability: 75, contactIdx: 17, quarter: 'current' },
      { name: 'Closing This Month - Deal 7', value: 300000, stage: 'negotiation', probability: 95, contactIdx: 18, quarter: 'current' },
      { name: 'Closing This Month - Deal 8', value: 180000, stage: 'proposal', probability: 80, contactIdx: 19, quarter: 'current' },
    ]

    // Check existing deals - preserve them and add more
    const existingDealsCount = await prisma.deal.count({ where: { tenantId } })
    const existingDeals = await prisma.deal.findMany({ 
      where: { tenantId },
      select: { id: true, name: true, stage: true, value: true, createdAt: true }
    })
    
    console.log(`[SEED] Found ${existingDealsCount} existing deals - will add more`)
    // Don't delete existing deals - just add more to them
    
    // Get current month dates
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const daysInMonth = endOfMonth.getDate()
    const daysElapsed = now.getDate() // Days elapsed in current month
    
    // Create deals in batches to avoid connection pool exhaustion
    const deals: any[] = []
    const DEAL_BATCH_SIZE = 3 // Reduced to avoid pool exhaustion
    
    // Pre-calculate Q4 deal indices for proper date distribution
    const q4Deals = dealsData.filter(d => d.quarter === 'q4')
    
    // Add existing deals to the deals array to preserve them
    if (existingDeals.length > 0) {
      console.log(`[SEED] Preserving ${existingDeals.length} existing deals`)
      deals.push(...existingDeals.map(d => ({
        id: d.id,
        name: d.name,
        stage: d.stage,
        value: d.value,
        createdAt: d.createdAt,
      })))
    }
    
    // Check how many deals exist in current month
    const currentMonthDealsCount = await prisma.deal.count({
      where: {
        tenantId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    })
    
    // Ensure we have at least 12 deals in current month for dashboard stats
    const currentMonthDealsNeeded = Math.max(0, 12 - currentMonthDealsCount)
    
    // ENHANCEMENT: Create more deals to reach 2000+ CRM records target
    // Target: 600 deals (to reach 2000+ total with contacts, tasks, meetings)
    const TARGET_DEALS = 600
    const totalDealsNeeded = Math.max(60, TARGET_DEALS - existingDealsCount)
    const newDealsToCreate = Math.max(currentMonthDealsNeeded, totalDealsNeeded - existingDealsCount)
    
    if (newDealsToCreate > 0) {
      console.log(`[SEED] Creating ${newDealsToCreate} additional deals (${currentMonthDealsNeeded} for current month)`)
      
      // ENHANCEMENT: Generate additional deals programmatically to reach target
      const dealTemplates = [
        'Enterprise Software License',
        'Cloud Services Agreement',
        'Consulting Services Contract',
        'Support & Maintenance Deal',
        'Annual Subscription Renewal',
        'Custom Development Project',
        'Data Analytics Platform',
        'Security & Compliance Package',
        'Training & Certification Deal',
        'Integration Services Contract',
        'Digital Transformation Deal',
        'Business Process Automation',
        'AI/ML Implementation',
        'Mobile App Development',
        'E-commerce Platform Setup',
      ]
      
      const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const
      const quarters = ['q1', 'q2', 'q3', 'q4', 'current'] as const
      
      // Generate additional deal data programmatically
      const generatedDeals: typeof dealsData = []
      for (let i = dealsData.length; i < newDealsToCreate; i++) {
        const template = dealTemplates[i % dealTemplates.length]
        const quarter = quarters[i % quarters.length]
        const stage = stages[i % stages.length]
        const value = 50000 + (i % 20) * 10000 + Math.floor(Math.random() * 50000) // ₹50K - ₹2.5L
        const probability = stage === 'won' ? 100 : stage === 'lost' ? 0 : 20 + (i % 60)
        
        generatedDeals.push({
          name: `${template} ${i + 1}`,
          value,
          stage,
          probability,
          contactIdx: i % contacts.length,
          quarter,
        })
      }
      
      // Prioritize current month deals first, then others
      const currentMonthDeals = dealsData.filter(d => d.quarter === 'current')
      const otherDeals = [...dealsData.filter(d => d.quarter !== 'current'), ...generatedDeals]
      
      // Create current month deals first, then others
      const dealsToCreate = [
        ...currentMonthDeals.slice(0, Math.min(currentMonthDealsNeeded, currentMonthDeals.length)),
        ...otherDeals.slice(0, Math.max(0, newDealsToCreate - currentMonthDealsNeeded)),
      ].slice(0, newDealsToCreate)
      
      for (let i = 0; i < dealsToCreate.length; i += DEAL_BATCH_SIZE) {
      const batch = dealsToCreate.slice(i, i + DEAL_BATCH_SIZE)
      const batchDeals = await Promise.all(
        batch.map((deal, batchIdx) => {
          const idx = i + batchIdx
          let dealCreatedAt: Date
          let dealExpectedCloseDate: Date
          let actualCloseDate: Date | undefined
          
          if (deal.quarter === 'q1') {
            // Q1 deals: Create in Q1 period (Apr-Jun)
            const q1Day = Math.floor(Math.random() * 90) + 1 // Random day in Q1 (Apr 1 - Jun 30)
            dealCreatedAt = new Date(fyStartYear, 3, Math.min(q1Day, 30), 12, 0, 0) // April
            if (q1Day > 30) {
              dealCreatedAt = new Date(fyStartYear, 4, Math.min(q1Day - 30, 31), 12, 0, 0) // May
            }
            if (q1Day > 61) {
              dealCreatedAt = new Date(fyStartYear, 5, Math.min(q1Day - 61, 30), 12, 0, 0) // June
            }
            actualCloseDate = deal.stage === 'won' ? dealCreatedAt : undefined
            dealExpectedCloseDate = dealCreatedAt
          } else if (deal.quarter === 'q2') {
            // Q2 deals: Create in Q2 period (Jul-Sep)
            const q2Day = Math.floor(Math.random() * 92) + 1 // Random day in Q2
            dealCreatedAt = new Date(fyStartYear, 6, Math.min(q2Day, 31), 12, 0, 0) // July
            if (q2Day > 31) {
              dealCreatedAt = new Date(fyStartYear, 7, Math.min(q2Day - 31, 31), 12, 0, 0) // August
            }
            if (q2Day > 62) {
              dealCreatedAt = new Date(fyStartYear, 8, Math.min(q2Day - 62, 30), 12, 0, 0) // September
            }
            actualCloseDate = deal.stage === 'won' ? dealCreatedAt : undefined
            dealExpectedCloseDate = dealCreatedAt
          } else if (deal.quarter === 'q3') {
            // Q3 deals: Create in Q3 period (Oct-Dec)
            const q3Day = Math.floor(Math.random() * 92) + 1 // Random day in Q3
            dealCreatedAt = new Date(fyStartYear, 9, Math.min(q3Day, 31), 12, 0, 0) // October
            if (q3Day > 31) {
              dealCreatedAt = new Date(fyStartYear, 10, Math.min(q3Day - 31, 30), 12, 0, 0) // November
            }
            if (q3Day > 61) {
              dealCreatedAt = new Date(fyStartYear, 11, Math.min(q3Day - 61, 31), 12, 0, 0) // December
            }
            actualCloseDate = deal.stage === 'won' ? dealCreatedAt : undefined
            dealExpectedCloseDate = dealCreatedAt
          } else if (deal.quarter === 'q4') {
            // Q4 deals: Create in Q4 period (Jan-Mar) - IMPORTANT for charts
            // Distribute evenly across Jan, Feb, Mar for better data spread
            const q4DealIndex = q4Deals.indexOf(deal)
            const monthInQ4 = q4DealIndex % 3 // 0=Jan, 1=Feb, 2=Mar
            const dayInMonth = Math.min((q4DealIndex % 28) + 1, 28) // Day 1-28
            dealCreatedAt = new Date(fyEndYear, monthInQ4, dayInMonth, 12, 0, 0)
            // For won deals, set actualCloseDate to the same date to ensure they're counted in Q4
            // Use the same date to ensure it falls within Q4 period (Jan-Mar 2026)
            actualCloseDate = deal.stage === 'won' ? new Date(fyEndYear, monthInQ4, dayInMonth, 14, 0, 0) : undefined
            dealExpectedCloseDate = dealCreatedAt
          } else {
            // Current month deals (for stat cards) - CRITICAL: These must be in CURRENT month
            if (deal.stage === 'won') {
              // Won deals this month: for "Revenue This Month"
              const dayInMonth = Math.min((idx % daysInMonth) + 1, daysInMonth)
              dealCreatedAt = new Date(now.getFullYear(), now.getMonth(), dayInMonth, 12, 0, 0)
              // Ensure not in future
              if (dealCreatedAt > now) {
                dealCreatedAt = new Date(now.getFullYear(), now.getMonth(), Math.min(dayInMonth, now.getDate()), 12, 0, 0)
              }
              actualCloseDate = dealCreatedAt
              dealExpectedCloseDate = dealCreatedAt
            } else if (deal.name.includes('Closing This Month')) {
              // Deals closing this month: for "Deals Closing This Month" stat
              const dayInMonth = Math.min((idx % daysInMonth) + 1, daysInMonth)
              dealCreatedAt = new Date(now.getFullYear(), now.getMonth() - 1, 15, 12, 0, 0) // Created last month
              dealExpectedCloseDate = new Date(now.getFullYear(), now.getMonth(), Math.min(dayInMonth + 5, daysInMonth), 12, 0, 0) // Closing this month
              // Ensure expectedCloseDate is not in future
              if (dealExpectedCloseDate > endOfMonth) {
                dealExpectedCloseDate = new Date(now.getFullYear(), now.getMonth(), Math.min(dayInMonth + 5, daysInMonth), 12, 0, 0)
              }
            } else {
              // Active deals created this month: for "Deals Created This Month" stat
              // CRITICAL: These MUST be created in the CURRENT month (not future/past)
              const dayInMonth = Math.min((idx % daysElapsed) + 1, daysElapsed)
              dealCreatedAt = new Date(now.getFullYear(), now.getMonth(), dayInMonth, 12, 0, 0)
              // Ensure createdAt is not in the future and is within current month
              if (dealCreatedAt > now) {
                dealCreatedAt = new Date(now.getFullYear(), now.getMonth(), Math.min(dayInMonth, now.getDate()), 12, 0, 0)
              }
              // Ensure it's within the current month bounds
              if (dealCreatedAt < startOfMonth) {
                dealCreatedAt = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0)
              }
              if (dealCreatedAt > endOfMonth) {
                dealCreatedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
              }
              dealExpectedCloseDate = new Date(now.getFullYear(), now.getMonth() + 1, 15, 12, 0, 0) // Next month
            }
          }
          
          return prisma.deal.create({
            data: {
              tenantId,
              name: deal.name,
              value: deal.value,
              stage: deal.stage as any,
              probability: deal.probability,
              expectedCloseDate: dealExpectedCloseDate,
              contactId: contacts[deal.contactIdx].id,
              actualCloseDate: actualCloseDate,
              createdAt: dealCreatedAt,
            },
          })
        })
      )
      deals.push(...batchDeals)
      // Delay between batches to allow connections to be released
      if (i + DEAL_BATCH_SIZE < dealsToCreate.length) {
        await new Promise(resolve => setTimeout(resolve, 200)) // Increased delay
      }
    }
    } else {
      console.log(`[SEED] Sufficient deals exist (${existingDealsCount}), not creating more`)
    }
    
    // CRITICAL: Ensure we have at least 12 deals in current month for dashboard stats
    const finalCurrentMonthCount = await prisma.deal.count({
      where: {
        tenantId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    })
    
    if (finalCurrentMonthCount < 12) {
      console.log(`[SEED] Only ${finalCurrentMonthCount} deals in current month, creating ${12 - finalCurrentMonthCount} more...`)
      const additionalNeeded = 12 - finalCurrentMonthCount
      const currentMonthDeals = dealsData.filter(d => d.quarter === 'current' && !d.name.includes('Closing This Month') && d.stage !== 'won')
      
      for (let i = 0; i < Math.min(additionalNeeded, currentMonthDeals.length); i++) {
        const deal = currentMonthDeals[i]
        const dayInMonth = Math.min((i % daysElapsed) + 1, daysElapsed)
        const dealCreatedAt = new Date(now.getFullYear(), now.getMonth(), dayInMonth, 12, 0, 0)
        
        // Ensure not in future
        if (dealCreatedAt > now) {
          dealCreatedAt.setDate(Math.min(dayInMonth, now.getDate()))
        }
        
        try {
          await prisma.deal.create({
            data: {
              tenantId,
              name: `${deal.name} (Additional ${i + 1})`,
              value: deal.value,
              stage: deal.stage as any,
              probability: deal.probability,
              expectedCloseDate: new Date(now.getFullYear(), now.getMonth() + 1, 15, 12, 0, 0),
              contactId: contacts[deal.contactIdx]?.id || contacts[0]?.id,
              createdAt: dealCreatedAt,
            },
          })
        } catch (err) {
          console.warn(`[SEED] Failed to create additional deal ${i + 1}:`, err)
        }
      }
      console.log(`[SEED] Created ${Math.min(additionalNeeded, currentMonthDeals.length)} additional deals for current month`)
    }

    console.log(`✅ Total deals: ${deals.length} (${existingDealsCount > 0 ? `${existingDealsCount} preserved, ${deals.length - existingDealsCount} added` : 'all created'})`)

    // Create sample products
    const productsData = [
      { name: 'Premium Software License', sku: 'PROD-001', costPrice: 5000, salePrice: 10000 },
      { name: 'Enterprise Support Package', sku: 'PROD-002', costPrice: 15000, salePrice: 30000 },
      { name: 'Basic Plan Subscription', sku: 'PROD-003', costPrice: 2000, salePrice: 5000 },
      { name: 'Professional Services', sku: 'PROD-004', costPrice: 10000, salePrice: 25000 },
      { name: 'Custom Development', sku: 'PROD-005', costPrice: 25000, salePrice: 60000 },
    ]

    await prisma.product.deleteMany({ where: { tenantId } })
    
    const products = await Promise.all(
      productsData.map((product) =>
        prisma.product.create({
          data: {
            tenantId,
            name: product.name,
            sku: product.sku,
            costPrice: product.costPrice,
            salePrice: product.salePrice,
            quantity: 100,
            categories: ['Software', 'Services'],
          },
        })
      )
    )

    console.log(`✅ Created ${products.length} products`)

    // Create sample invoices
    const invoicesData = [
      { customerIdx: 0, total: 54000, status: 'paid' },
      { customerIdx: 1, total: 31500, status: 'paid' },
      { customerIdx: 2, total: 135000, status: 'paid' },
      { customerIdx: 7, total: 180000, status: 'paid' },
      { customerIdx: 10, total: 90000, status: 'paid' },
      { customerIdx: 12, total: 81000, status: 'paid' },
      { customerIdx: 13, total: 162000, status: 'paid' },
      { customerIdx: 17, total: 108000, status: 'paid' },
      { customerIdx: 19, total: 540000, status: 'pending' },
      { customerIdx: 0, total: 27000, status: 'overdue' },
    ]

    await prisma.invoice.deleteMany({ where: { tenantId } })
    
    const invoices = await Promise.all(
      invoicesData.map((invoice, idx) => {
        const subtotal = invoice.total / 1.18
        const tax = invoice.total - subtotal
        // Create invoices in current month for Finance dashboard stats
        const invoiceDate = new Date(now.getFullYear(), now.getMonth(), Math.min(idx + 1, 28), 12, 0, 0)
        return prisma.invoice.create({
          data: {
            tenantId,
            invoiceNumber: `INV-${String(idx + 1).padStart(4, '0')}`,
            status: invoice.status as any,
            subtotal,
            tax,
            total: invoice.total,
            customerId: contacts[invoice.customerIdx].id,
            invoiceDate,
            dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            // For paid invoices, set paidAt in current month (within last 7 days) for Finance dashboard stats
            paidAt: invoice.status === 'paid' ? new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - (idx % 7)), 14, 0, 0) : null,
            createdAt: invoiceDate, // Set createdAt to current month for stats
          },
        })
      })
    )

    console.log(`✅ Created ${invoices.length} invoices`)

    // Create sample orders
    const ordersData = [
      { customerIdx: 0, total: 54000, status: 'delivered' },
      { customerIdx: 1, total: 31500, status: 'delivered' },
      { customerIdx: 2, total: 135000, status: 'delivered' },
      { customerIdx: 7, total: 180000, status: 'delivered' },
      { customerIdx: 10, total: 90000, status: 'shipped' },
      { customerIdx: 12, total: 81000, status: 'confirmed' },
    ]

    await prisma.order.deleteMany({ where: { tenantId } })
    
    const orders = await Promise.all(
      ordersData.map((order, idx) => {
        const subtotal = order.total / 1.18
        const tax = order.total - subtotal
        return prisma.order.create({
          data: {
            tenantId,
            orderNumber: `ORD-${String(idx + 1).padStart(4, '0')}`,
            status: order.status as any,
            subtotal,
            tax,
            shipping: 0,
            total: order.total,
            shippingAddress: contacts[order.customerIdx].address || '',
            shippingCity: contacts[order.customerIdx].city || '',
            shippingPostal: contacts[order.customerIdx].postalCode || '',
            shippingCountry: 'India',
            customerId: contacts[order.customerIdx].id,
            paidAt: order.status === 'delivered' ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : null,
            shippedAt: ['shipped', 'delivered'].includes(order.status) ? new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) : null,
            deliveredAt: order.status === 'delivered' ? new Date(now.getTime()) : null,
          },
        })
      })
    )

    console.log(`✅ Created ${orders.length} orders`)

    // Create sample tasks (30+ tasks - mix of overdue and upcoming)
    const tasksData = [
      // Overdue tasks (past due dates)
      { title: 'Follow up with John Doe', status: 'pending', priority: 'high', contactIdx: 0, daysOffset: -5 },
      { title: 'Prepare proposal for Acme', status: 'in_progress', priority: 'medium', contactIdx: 2, daysOffset: -3 },
      { title: 'Review contract with Enterprise Group', status: 'pending', priority: 'high', contactIdx: 18, daysOffset: -7 },
      { title: 'Send quote to Tech Innovations', status: 'pending', priority: 'medium', contactIdx: 5, daysOffset: -2 },
      { title: 'Schedule demo for Business Growth Co', status: 'pending', priority: 'high', contactIdx: 6, daysOffset: -1 },
      { title: 'Call back Customer First Ltd', status: 'pending', priority: 'high', contactIdx: 17, daysOffset: -10 },
      { title: 'Send contract to Partner Network', status: 'in_progress', priority: 'medium', contactIdx: 13, daysOffset: -4 },
      { title: 'Follow up on proposal - Client Services', status: 'pending', priority: 'high', contactIdx: 12, daysOffset: -6 },
      { title: 'Update CRM records for Digital Marketing', status: 'pending', priority: 'low', contactIdx: 1, daysOffset: -8 },
      { title: 'Schedule meeting with Enterprise Solutions', status: 'pending', priority: 'medium', contactIdx: 4, daysOffset: -9 },
      { title: 'Send follow-up email to AI Tech Solutions', status: 'pending', priority: 'medium', contactIdx: 20, daysOffset: -6 },
      { title: 'Prepare quote for Blockchain Innovations', status: 'pending', priority: 'high', contactIdx: 21, daysOffset: -4 },
      { title: 'Schedule discovery call with FinTech Solutions', status: 'pending', priority: 'high', contactIdx: 23, daysOffset: -2 },
      { title: 'Review proposal for SaaS Platform Inc', status: 'in_progress', priority: 'medium', contactIdx: 27, daysOffset: -5 },
      { title: 'Follow up with Cloud Infrastructure', status: 'pending', priority: 'high', contactIdx: 32, daysOffset: -3 },
      // Upcoming tasks (not overdue)
      { title: 'Prepare presentation for Global Solutions', status: 'pending', priority: 'high', contactIdx: 19, daysOffset: 7 },
      { title: 'Review proposal draft', status: 'in_progress', priority: 'medium', contactIdx: 10, daysOffset: 5 },
      { title: 'Send follow-up email', status: 'pending', priority: 'low', contactIdx: 11, daysOffset: 3 },
      { title: 'Schedule product demo', status: 'pending', priority: 'high', contactIdx: 14, daysOffset: 10 },
      { title: 'Prepare contract documents', status: 'pending', priority: 'medium', contactIdx: 15, daysOffset: 6 },
      { title: 'Follow up with Healthcare Tech', status: 'pending', priority: 'medium', contactIdx: 24, daysOffset: 4 },
      { title: 'Schedule meeting with EdTech Platform', status: 'pending', priority: 'high', contactIdx: 25, daysOffset: 8 },
      { title: 'Send proposal to E-commerce Solutions', status: 'pending', priority: 'high', contactIdx: 26, daysOffset: 5 },
      { title: 'Prepare demo for Mobile App Dev', status: 'pending', priority: 'medium', contactIdx: 28, daysOffset: 6 },
      { title: 'Follow up call with IT Consulting Group', status: 'pending', priority: 'high', contactIdx: 30, daysOffset: 7 },
      { title: 'Review contract with Cloud Infrastructure', status: 'pending', priority: 'medium', contactIdx: 32, daysOffset: 9 },
      { title: 'Send quote to Data Science Labs', status: 'pending', priority: 'high', contactIdx: 33, daysOffset: 4 },
      { title: 'Schedule demo for Machine Learning Co', status: 'pending', priority: 'high', contactIdx: 34, daysOffset: 8 },
      { title: 'Follow up with IoT Solutions', status: 'pending', priority: 'medium', contactIdx: 35, daysOffset: 5 },
      { title: 'Prepare proposal for Automation Systems', status: 'pending', priority: 'high', contactIdx: 36, daysOffset: 6 },
    ]

    // Check existing tasks - preserve and add more
    const existingTasksCount = await prisma.task.count({ where: { tenantId } })
    const existingTasks = await prisma.task.findMany({ 
      where: { tenantId },
      select: { id: true, title: true, status: true, dueDate: true }
    })
    
    console.log(`[SEED] Found ${existingTasksCount} existing tasks - will add more`)
    
    // ENHANCEMENT: Create more tasks to reach 2000+ CRM records target
    // Target: 500 tasks (to reach 2000+ total with contacts, deals, meetings)
    const TARGET_TASKS = 500
    const totalTasksNeeded = Math.max(40, TARGET_TASKS - existingTasksCount)
    const newTasksToCreate = Math.max(0, totalTasksNeeded - existingTasksCount)
    const tasks: any[] = [...existingTasks]
    
    if (newTasksToCreate > 0) {
      // ENHANCEMENT: Generate additional tasks programmatically
      const taskTemplates = [
        'Follow up with',
        'Prepare proposal for',
        'Review contract with',
        'Send quote to',
        'Schedule demo for',
        'Call back',
        'Send contract to',
        'Follow up on proposal -',
        'Update CRM records for',
        'Schedule meeting with',
        'Send follow-up email to',
        'Prepare quote for',
        'Schedule discovery call with',
        'Review proposal for',
        'Follow up with',
      ]
      
      const statuses = ['pending', 'in_progress', 'completed'] as const
      const priorities = ['low', 'medium', 'high'] as const
      
      // Generate additional task data
      const generatedTasks: typeof tasksData = []
      for (let i = tasksData.length; i < newTasksToCreate; i++) {
        const template = taskTemplates[i % taskTemplates.length]
        const contactName = contacts[i % contacts.length]?.name || 'Contact'
        const daysOffset = i % 30 - 15 // Mix of overdue (-15 to -1) and upcoming (1 to 14)
        
        generatedTasks.push({
          title: `${template} ${contactName}`,
          status: statuses[i % statuses.length],
          priority: priorities[i % priorities.length],
          contactIdx: i % contacts.length,
          daysOffset,
        })
      }
      
      const allTasksToCreate = [...tasksData, ...generatedTasks].slice(0, newTasksToCreate)
      const newTasks = await Promise.all(
        allTasksToCreate.map((task) => {
          // Ensure tasks have proper due dates - some should be overdue, some today, some upcoming
          let dueDate = new Date(now.getTime() + task.daysOffset * 24 * 60 * 60 * 1000)
          // Ensure overdue tasks are actually in the past
          if (task.daysOffset < 0 && dueDate > now) {
            dueDate = new Date(now.getTime() - Math.abs(task.daysOffset) * 24 * 60 * 60 * 1000)
          }
          
          return prisma.task.create({
            data: {
              tenantId,
              title: task.title,
              description: `Task: ${task.title}`,
              status: task.status as any,
              priority: task.priority as any,
              dueDate,
              contactId: contacts[task.contactIdx]?.id || contacts[0]?.id,
              assignedToId: adminUser.id,
            },
          })
        })
      )
      tasks.push(...newTasks)
    }
    
    // CRITICAL: Ensure we have at least some overdue tasks for dashboard stats
    const overdueTasksCount = await prisma.task.count({
      where: {
        tenantId,
        dueDate: { lt: now },
        status: { in: ['pending', 'in_progress'] },
      },
    })
    
    if (overdueTasksCount === 0 && tasks.length > 0) {
      // Create at least 2-3 overdue tasks
      console.log(`[SEED] No overdue tasks found, creating 3 overdue tasks...`)
      const overdueTasksToCreate = tasksData.filter(t => t.daysOffset < 0).slice(0, 3)
      for (const task of overdueTasksToCreate) {
        try {
          await prisma.task.create({
            data: {
              tenantId,
              title: `Overdue: ${task.title}`,
              description: `Overdue task: ${task.title}`,
              status: 'pending' as any,
              priority: task.priority as any,
              dueDate: new Date(now.getTime() - Math.abs(task.daysOffset) * 24 * 60 * 60 * 1000),
              contactId: contacts[task.contactIdx]?.id || contacts[0]?.id,
              assignedToId: adminUser.id,
            },
          })
        } catch (err) {
          console.warn(`[SEED] Failed to create overdue task:`, err)
        }
      }
    }

    console.log(`✅ Total tasks: ${tasks.length} (${existingTasksCount > 0 ? `${existingTasksCount} preserved, ${tasks.length - existingTasksCount} added` : 'all created'})`)

    // Create Lead Sources and assign to contacts
    const leadSourcesData = [
      { name: 'Google Search', type: 'organic' },
      { name: 'Facebook Ads', type: 'paid_ad' },
      { name: 'LinkedIn', type: 'social' },
      { name: 'Referral', type: 'referral' },
      { name: 'Website Form', type: 'organic' },
      { name: 'Email Campaign', type: 'email' },
      { name: 'Trade Show', type: 'event' },
      { name: 'Cold Call', type: 'direct' },
      { name: 'YouTube Ads', type: 'paid_ad' },
      { name: 'Partner Channel', type: 'partner' },
    ]

    await prisma.leadSource.deleteMany({ where: { tenantId } })
    
    const leadSources = await Promise.all(
      leadSourcesData.map((source) =>
        prisma.leadSource.create({
          data: {
            tenantId,
            name: source.name,
            type: source.type,
            leadsCount: 0,
            conversionsCount: 0,
            totalValue: 0,
            avgDealValue: 0,
            conversionRate: 0,
            roi: 0,
          },
        })
      )
    )

    // Assign lead sources to contacts in batches (already set source field above, now link sourceId)
    const UPDATE_BATCH_SIZE = 3 // Reduced to avoid pool exhaustion
    for (let i = 0; i < contacts.length; i += UPDATE_BATCH_SIZE) {
      const batch = contacts.slice(i, i + UPDATE_BATCH_SIZE)
      await Promise.all(
        batch.map((contact, batchIdx) => {
          const idx = i + batchIdx
          return prisma.contact.update({
            where: { id: contact.id },
            data: {
              sourceId: leadSources[idx % leadSources.length].id,
            },
          })
        })
      )
      // Delay between batches to allow connections to be released
      if (i + UPDATE_BATCH_SIZE < contacts.length) {
        await new Promise(resolve => setTimeout(resolve, 200)) // Increased delay
      }
    }

    // Update lead source counts (with delay to avoid connection pool exhaustion)
    for (let i = 0; i < leadSources.length; i++) {
      const source = leadSources[i]
      const sourceContacts = await prisma.contact.count({
        where: { tenantId, sourceId: source.id },
      })
      const sourceDeals = await prisma.deal.findMany({
        where: {
          tenantId,
          contact: { sourceId: source.id },
        },
        select: { value: true, stage: true },
      })
      const wonDeals = sourceDeals.filter(d => d.stage === 'won')
      const totalValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0)
      
      await prisma.leadSource.update({
        where: { id: source.id },
        data: {
          leadsCount: sourceContacts,
          conversionsCount: wonDeals.length,
          totalValue,
          avgDealValue: wonDeals.length > 0 ? totalValue / wonDeals.length : 0,
          conversionRate: sourceContacts > 0 ? (wonDeals.length / sourceContacts) * 100 : 0,
        },
      })
      
      // Small delay between updates
      if (i < leadSources.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`✅ Created ${leadSources.length} lead sources`)

    // Create sample purchase orders for Finance dashboard
    const purchaseOrdersData = [
      { vendorName: 'Vendor A', total: 50000, status: 'ordered' },
      { vendorName: 'Vendor B', total: 75000, status: 'ordered' },
      { vendorName: 'Vendor C', total: 120000, status: 'approved' },
      { vendorName: 'Vendor D', total: 90000, status: 'received' },
      { vendorName: 'Vendor E', total: 60000, status: 'ordered' },
    ]

    // Create vendors first if they don't exist
    const vendors = await Promise.all(
      purchaseOrdersData.map((po, idx) =>
        prisma.vendor.upsert({
          where: { id: `vendor-${idx + 1}` },
          update: {},
          create: {
            id: `vendor-${idx + 1}`,
            tenantId,
            name: po.vendorName,
            companyName: `${po.vendorName} Pvt Ltd`,
            email: `contact@${po.vendorName.toLowerCase().replace(/\s+/g, '')}.com`,
            phone: `+91-9876543${String(idx + 1).padStart(3, '0')}`,
            address: 'Bangalore, Karnataka',
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India',
          },
        })
      )
    )

    await prisma.purchaseOrder.deleteMany({ where: { tenantId } })
    
    const purchaseOrders = await Promise.all(
      purchaseOrdersData.map((po, idx) => {
        const poDate = new Date(now.getFullYear(), now.getMonth(), Math.min(idx + 1, 28), 12, 0, 0)
        return prisma.purchaseOrder.create({
          data: {
            tenantId,
            poNumber: `PO-${String(idx + 1).padStart(4, '0')}`,
            vendorId: vendors[idx].id,
            status: po.status as any,
            orderDate: poDate,
            expectedDeliveryDate: new Date(poDate.getTime() + 15 * 24 * 60 * 60 * 1000),
            subtotal: po.total / 1.18,
            tax: po.total - (po.total / 1.18),
            total: po.total,
            requestedById: adminUser.id,
            createdAt: poDate, // Set createdAt to current month for stats
          },
        })
      })
    )

    console.log(`✅ Created ${purchaseOrders.length} purchase orders`)

    // Create sample expenses (for Net Profit calculation)
    const expensesData = [
      { description: 'Office Rent - January', amount: 50000, category: 'Rent', vendor: 'Property Management Co', gstAmount: 9000 },
      { description: 'Internet & Phone Bills', amount: 15000, category: 'Utilities', vendor: 'Telecom Provider', gstAmount: 2700 },
      { description: 'Software Subscriptions', amount: 25000, category: 'Software', vendor: 'SaaS Provider', gstAmount: 4500 },
      { description: 'Marketing Campaign', amount: 40000, category: 'Marketing', vendor: 'Digital Agency', gstAmount: 7200 },
      { description: 'Employee Salaries', amount: 200000, category: 'Salaries', vendor: 'Payroll', gstAmount: 0 },
      { description: 'Office Supplies', amount: 10000, category: 'Supplies', vendor: 'Stationery Store', gstAmount: 1800 },
      { description: 'Travel & Conferences', amount: 30000, category: 'Travel', vendor: 'Travel Agency', gstAmount: 5400 },
      { description: 'Professional Services', amount: 35000, category: 'Services', vendor: 'Consulting Firm', gstAmount: 6300 },
      { description: 'Equipment Purchase', amount: 60000, category: 'Equipment', vendor: 'Tech Supplier', gstAmount: 10800 },
      { description: 'Insurance Premium', amount: 20000, category: 'Insurance', vendor: 'Insurance Co', gstAmount: 3600 },
    ]

    await prisma.expense.deleteMany({ where: { tenantId } })
    
    const expenses = await Promise.all(
      expensesData.map((expense, idx) => {
        // Create expenses in current month and previous months for better data distribution
        const expenseDate = idx < 5 
          ? new Date(now.getFullYear(), now.getMonth(), Math.min(idx + 1, 28), 12, 0, 0) // Current month
          : new Date(now.getFullYear(), now.getMonth() - 1, Math.min((idx - 5) + 1, 28), 12, 0, 0) // Last month
        return prisma.expense.create({
          data: {
            tenantId,
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            vendor: expense.vendor,
            date: expenseDate,
            gstAmount: expense.gstAmount,
            hsnCode: '998314', // Standard HSN code for services
            status: idx < 7 ? 'approved' : 'paid', // Mix of approved and paid for variety
            createdAt: expenseDate,
          },
        })
      })
    )

    console.log(`✅ Created ${expenses.length} expenses`)

    // Create sample meetings (15+ meetings)
    const meetingsData = [
      { title: 'Discovery Call - AI Tech Solutions', contactIdx: 20, daysOffset: 2, duration: 30 },
      { title: 'Product Demo - Blockchain Innovations', contactIdx: 21, daysOffset: 5, duration: 60 },
      { title: 'Proposal Review - FinTech Solutions', contactIdx: 23, daysOffset: 7, duration: 45 },
      { title: 'Follow-up Meeting - Healthcare Tech', contactIdx: 24, daysOffset: 3, duration: 30 },
      { title: 'Contract Discussion - SaaS Platform Inc', contactIdx: 27, daysOffset: 6, duration: 60 },
      { title: 'Technical Deep Dive - Cloud Infrastructure', contactIdx: 32, daysOffset: 4, duration: 90 },
      { title: 'Q&A Session - Data Science Labs', contactIdx: 33, daysOffset: 8, duration: 45 },
      { title: 'Onboarding Meeting - Tech Solutions Inc', contactIdx: 0, daysOffset: 1, duration: 60 },
      { title: 'Quarterly Review - Digital Marketing Pro', contactIdx: 1, daysOffset: 10, duration: 45 },
      { title: 'Strategy Session - Acme Corporation', contactIdx: 2, daysOffset: 12, duration: 90 },
      { title: 'Product Training - Corporate Ventures', contactIdx: 7, daysOffset: 9, duration: 60 },
      { title: 'Support Call - Digital Solutions', contactIdx: 10, daysOffset: 2, duration: 30 },
      { title: 'Renewal Discussion - Client Services Inc', contactIdx: 12, daysOffset: 11, duration: 45 },
      { title: 'Expansion Meeting - Partner Network', contactIdx: 13, daysOffset: 6, duration: 60 },
      { title: 'Executive Briefing - Global Solutions', contactIdx: 19, daysOffset: 14, duration: 90 },
    ]

    // Check existing meetings - preserve and add more
    const existingMeetingsCount = await prisma.meeting.count({ where: { tenantId } })
    const existingMeetings = await prisma.meeting.findMany({ 
      where: { tenantId },
      select: { id: true, title: true, status: true, startTime: true }
    })
    
    console.log(`[SEED] Found ${existingMeetingsCount} existing meetings - will add more`)
    
    // ENHANCEMENT: Create more meetings to reach 2000+ CRM records target
    // Target: 100 meetings (to reach 2000+ total with contacts, deals, tasks)
    const TARGET_MEETINGS = 100
    const totalMeetingsNeeded = Math.max(20, TARGET_MEETINGS - existingMeetingsCount)
    const newMeetingsToCreate = Math.max(0, totalMeetingsNeeded - existingMeetingsCount)
    const meetings: any[] = [...existingMeetings]
    
    if (newMeetingsToCreate > 0) {
      // ENHANCEMENT: Generate additional meetings programmatically
      const meetingTemplates = [
        'Discovery Call',
        'Product Demo',
        'Proposal Review',
        'Follow-up Meeting',
        'Contract Discussion',
        'Technical Deep Dive',
        'Q&A Session',
        'Onboarding Meeting',
        'Quarterly Review',
        'Strategy Session',
        'Product Training',
        'Support Call',
        'Renewal Discussion',
        'Expansion Meeting',
        'Executive Briefing',
      ]
      
      // Generate additional meeting data
      const generatedMeetings: typeof meetingsData = []
      for (let i = meetingsData.length; i < newMeetingsToCreate; i++) {
        const template = meetingTemplates[i % meetingTemplates.length]
        const contactName = contacts[i % contacts.length]?.name || 'Contact'
        const daysOffset = i % 30 - 7 // Mix of past (-7 to -1) and future (1 to 22)
        const duration = [30, 45, 60, 90][i % 4]
        
        generatedMeetings.push({
          title: `${template} - ${contactName}`,
          contactIdx: i % contacts.length,
          daysOffset,
          duration,
        })
      }
      
      const allMeetingsToCreate = [...meetingsData, ...generatedMeetings].slice(0, newMeetingsToCreate)
      const newMeetings = await Promise.all(
        allMeetingsToCreate.map((meeting, idx) => {
          const startTime = new Date(now.getTime() + meeting.daysOffset * 24 * 60 * 60 * 1000)
          startTime.setHours(10 + (idx % 6), (idx % 4) * 15, 0, 0) // Spread across day
          const endTime = new Date(startTime.getTime() + meeting.duration * 60 * 1000)
          const meetingCode = `MTG-${String(existingMeetingsCount + idx + 1).padStart(6, '0')}`
          
          return prisma.meeting.create({
            data: {
              tenantId,
              title: meeting.title,
              description: `Meeting with ${contacts[meeting.contactIdx]?.name || 'Contact'}`,
              meetingCode,
              startTime,
              endTime,
              status: meeting.daysOffset < 0 ? 'ended' : meeting.daysOffset === 0 ? 'in-progress' : 'scheduled',
              hostId: adminUser.id,
              participants: [contacts[meeting.contactIdx]?.id || contacts[0]?.id],
              createdAt: startTime,
            },
          })
        })
      )
      meetings.push(...newMeetings)
    }

    console.log(`✅ Total meetings: ${meetings.length} (${existingMeetingsCount > 0 ? `${existingMeetingsCount} preserved, ${meetings.length - existingMeetingsCount} added` : 'all created'})`)

    // Create website and visitor sessions for Visitors page
    let website = await prisma.website.findFirst({ where: { tenantId } })
    if (!website) {
      website = await prisma.website.create({
        data: {
          tenantId,
          name: 'Main Website',
          domain: 'demobusiness.com',
          status: 'active',
        },
      })
    }

    // Create sample visitor sessions (20+ sessions)
    await prisma.websiteSession.deleteMany({ where: { tenantId } })
    
    const visitorSessions = []
    const visitorIds = Array.from({ length: 15 }, (_, i) => `visitor-${i + 1}`)
    
    for (let i = 0; i < 20; i++) {
      const visitorId = visitorIds[i % visitorIds.length]
      const sessionDate = new Date(now.getTime() - (i % 7) * 24 * 60 * 60 * 1000) // Last 7 days
      sessionDate.setHours(9 + (i % 8), (i % 4) * 15, 0, 0)
      
      const session = await prisma.websiteSession.create({
        data: {
          tenantId,
          websiteId: website.id,
          visitorId,
          startedAt: sessionDate,
          endedAt: new Date(sessionDate.getTime() + (60 + (i % 120)) * 60 * 1000), // 1-3 hours
          duration: 60 + (i % 120),
          pageViews: 3 + (i % 10),
          device: ['Desktop', 'Mobile', 'Tablet'][i % 3],
          browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][i % 4],
          os: ['Windows', 'macOS', 'iOS', 'Android'][i % 4],
          country: 'India',
          city: ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad'][i % 4],
          referrer: i % 3 === 0 ? 'google.com' : i % 3 === 1 ? 'linkedin.com' : 'direct',
        },
      })
      
      // Create page visits for this session
      const pages = ['/', '/products', '/pricing', '/about', '/contact']
      for (let j = 0; j < Math.min(session.pageViews, 5); j++) {
        let page = await prisma.websitePage.findFirst({
          where: { tenantId, websiteId: website.id, path: pages[j % pages.length] },
        })
        
        if (!page) {
          page = await prisma.websitePage.create({
            data: {
              tenantId,
              websiteId: website.id,
              path: pages[j % pages.length],
              title: pages[j % pages.length] === '/' ? 'Home' : pages[j % pages.length].charAt(1).toUpperCase() + pages[j % pages.length].slice(2),
            },
          })
        }
        
        await prisma.websiteVisit.create({
          data: {
            tenantId,
            sessionId: session.id,
            pageId: page.id,
            visitedAt: new Date(sessionDate.getTime() + j * 30 * 1000),
            device: session.device,
            browser: session.browser,
            os: session.os,
            country: session.country,
            city: session.city,
            referrer: session.referrer,
          },
        })
      }
      
      // Create some events for high-intent visitors
      if (i % 3 === 0) {
        await prisma.websiteEvent.create({
          data: {
            tenantId,
            sessionId: session.id,
            eventType: 'engagement',
            eventName: 'form_submit',
            occurredAt: new Date(sessionDate.getTime() + 5 * 60 * 1000),
            metadata: { formName: 'Contact Form' },
          },
        })
      }
      if (i % 4 === 0) {
        await prisma.websiteEvent.create({
          data: {
            tenantId,
            sessionId: session.id,
            eventType: 'engagement',
            eventName: 'scroll_depth',
            occurredAt: new Date(sessionDate.getTime() + 3 * 60 * 1000),
            metadata: { depth: 75 },
          },
        })
      }
      
      visitorSessions.push(session)
    }

    console.log(`✅ Created ${visitorSessions.length} visitor sessions`)

    // Create GST Reports (stored as Report model with type 'gst')
    const gstReportsData = [
      {
        name: 'GSTR-1 - January 2026',
        description: 'Monthly GST sales report (GSTR-1) for January 2026',
        type: 'gst',
        config: {
          reportType: 'gstr1',
          dateRange: 'month',
          month: 1,
          year: 2026,
          dataType: 'sales',
          columns: ['invoiceNumber', 'invoiceDate', 'customerName', 'gstin', 'cgst', 'sgst', 'igst', 'total'],
        },
      },
      {
        name: 'GSTR-3B - January 2026',
        description: 'Monthly GST return summary (GSTR-3B) for January 2026',
        type: 'gst',
        config: {
          reportType: 'gstr3b',
          dateRange: 'month',
          month: 1,
          year: 2026,
          dataType: 'summary',
          columns: ['outputGST', 'inputGST', 'netGSTPayable', 'taxBreakdown'],
        },
      },
      {
        name: 'GST Purchase Report - January 2026',
        description: 'Monthly GST purchase report with input tax credit',
        type: 'gst',
        config: {
          reportType: 'purchase',
          dateRange: 'month',
          month: 1,
          year: 2026,
          dataType: 'purchase',
          columns: ['vendorName', 'invoiceNumber', 'invoiceDate', 'gstin', 'cgst', 'sgst', 'igst', 'total'],
        },
      },
      {
        name: 'GSTR-1 - December 2025',
        description: 'Monthly GST sales report (GSTR-1) for December 2025',
        type: 'gst',
        config: {
          reportType: 'gstr1',
          dateRange: 'month',
          month: 12,
          year: 2025,
          dataType: 'sales',
          columns: ['invoiceNumber', 'invoiceDate', 'customerName', 'gstin', 'cgst', 'sgst', 'igst', 'total'],
        },
      },
      {
        name: 'GSTR-3B - December 2025',
        description: 'Monthly GST return summary (GSTR-3B) for December 2025',
        type: 'gst',
        config: {
          reportType: 'gstr3b',
          dateRange: 'month',
          month: 12,
          year: 2025,
          dataType: 'summary',
          columns: ['outputGST', 'inputGST', 'netGSTPayable', 'taxBreakdown'],
        },
      },
    ]

    await prisma.report.deleteMany({ where: { tenantId, type: 'gst' } })
    
    const gstReports = await Promise.all(
      gstReportsData.map((report) =>
        prisma.report.create({
          data: {
            tenantId,
            name: report.name,
            description: report.description,
            type: 'gst',
            config: report.config,
            createdById: adminUser.id,
            isPublic: false,
            isActive: true,
          },
        })
      )
    )

    console.log(`✅ Created ${gstReports.length} GST reports`)

    // Seed industry-specific data
    console.log('🌾 Seeding Industry Data...')
    try {
      await seedIndustryDataInline(tenantId, contacts)
      console.log('✅ Industry Data seeded')
    } catch (industryError) {
      console.warn('Industry data seeding failed (non-critical):', industryError)
    }

    // Seed all other modules (HR, Marketing, Projects, etc.)
    console.log('🌱 Seeding All Modules...')
    let moduleData: any = {}
    try {
      moduleData = await seedAllModules(tenantId, adminUser.id, contacts, now)
      console.log('✅ All modules seeded')
    } catch (moduleError) {
      console.warn('Module seeding failed (non-critical):', moduleError)
    }

    // Invalidate cache
    try {
      const { cache } = await import('@/lib/redis/client')
      await cache.deletePattern(`contacts:${tenantId}:*`)
      await cache.deletePattern(`deals:${tenantId}:*`)
      await cache.deletePattern(`dashboard:stats:${tenantId}`)
    } catch (cacheError) {
      console.warn('Cache invalidation failed (non-critical):', cacheError)
    }

    return {
      success: true,
      message: 'Sample data seeded successfully',
      tenantId: tenant.id,
      businessName: tenant.name,
      hasPersonalizedId: tenant.id.startsWith('demo-') && tenant.id.includes('-'),
      counts: {
        contacts: contacts.length + (moduleData.crm?.contacts?.length || 0),
        deals: deals.length + (moduleData.crm?.deals?.length || 0),
        products: products.length + (moduleData.inventory?.products?.length || 0),
        invoices: invoices.length + (moduleData.finance?.invoices?.length || 0),
        orders: orders.length + (moduleData.sales?.orders?.length || 0),
        tasks: tasks.length + (moduleData.crm?.tasks?.length || 0),
        meetings: meetings.length,
        leadSources: leadSources.length,
        purchaseOrders: purchaseOrders.length,
        employees: moduleData.hr?.employees?.length || 0,
        attendance: moduleData.hr?.attendanceRecords?.length || 0,
        campaigns: moduleData.marketing?.campaigns?.length || 0,
        marketingLeads: moduleData.marketing?.leads?.length || 0,
        projects: moduleData.projects?.projects?.length || 0,
        projectTasks: moduleData.projects?.projectTasks?.length || 0,
        visitorSessions: visitorSessions.length,
      },
    }
  } catch (error) {
    console.error('[SEED_DEMO_DATA] Seed demo data error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('[SEED_DEMO_DATA] Error stack:', errorStack)
    
    // Re-throw with more context
    throw new Error(`Failed to seed demo data: ${errorMessage}${errorStack ? `\nStack: ${errorStack}` : ''}`)
  }
}

