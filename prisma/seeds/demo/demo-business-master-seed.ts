// @ts-nocheck
/**
 * Master Demo Business Seeder
 * Orchestrates seeding of all modules for Demo Business Pvt Ltd
 * Date Range: March 2025 - February 2026
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { DEMO_DATE_RANGE } from './date-utils'
import { resetDemoBusinessData } from './reset-demo-business'
import { seedCRMModule, type CRMSeedResult } from './seed-crm'
import { seedSalesAndBillingModule, SalesBillingSeedResult } from './seed-sales-billing'
import { seedMarketingModule, MarketingSeedResult } from './seed-marketing'
import { seedSupportModule, SupportSeedResult } from './seed-support'
import { seedOperationsModule, OperationsSeedResult } from './seed-operations'

// Create PrismaClient with minimal connections for seeding
// CRITICAL: Use direct connection or transaction mode to avoid PgBouncer session mode limits
function createSeedPrismaClient(): PrismaClient {
  // Priority: 1. Direct connection, 2. Transaction mode pooler, 3. Regular pooler
  let databaseUrl = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Parse and enhance DATABASE_URL with minimal connection pool for seeding
  const url = new URL(databaseUrl)
  
  // CRITICAL: Use only 1 connection for seeding to avoid pool exhaustion
  url.searchParams.set('connection_limit', '1')
  
  // Faster timeouts for seeding
  url.searchParams.set('pool_timeout', '10')
  url.searchParams.set('connect_timeout', '5')

  // For Supabase pooler, convert to TRANSACTION mode (not session mode)
  // Transaction mode allows more concurrent connections
  if (url.hostname.includes('pooler.supabase.com')) {
    // Ensure we're using transaction mode (port 6543 with pgbouncer=true)
    // Session mode has strict limits, transaction mode is more flexible
    url.searchParams.set('pgbouncer', 'true')
    
    // If port is 5432 (session mode), change to 6543 (transaction mode)
    if (url.port === '5432' || !url.port) {
      url.port = '6543'
    }
  }
  
  // For direct connection (db.*.supabase.co), use as-is
  // Direct connections bypass pooler entirely

  const enhancedDatabaseUrl = url.toString()
  
  console.log(`[SEED_PRISMA] Using connection: ${url.hostname}:${url.port} (${url.hostname.includes('pooler') ? 'pooler' : 'direct'})`)

  return new PrismaClient({
    datasources: {
      db: {
        url: enhancedDatabaseUrl,
      },
    },
  })
}

// Lazy init: avoid creating Prisma/DB connection at import time (e.g. during Next.js build)
let _prisma: PrismaClient | null = null
function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = createSeedPrismaClient()
  return _prisma
}

const DEMO_LICENSED_MODULES = [
  'crm',
  'sales',
  'marketing',
  'finance',
  'hr',
  'communication',
  'ai-studio',
  'analytics',
  'projects',
  'inventory',
]

const DEMO_EMPLOYEE_BLUEPRINTS = [
  { firstName: 'Aarav', lastName: 'Mehta', email: 'admin@demo.com', role: 'owner', rbacRole: 'Owner', title: 'Founder & CEO' },
  { firstName: 'Nisha', lastName: 'Rao', email: 'businessadmin@demobusiness.com', role: 'admin', rbacRole: 'Admin', title: 'Business Administrator' },
  { firstName: 'Rohan', lastName: 'Kapoor', email: 'rohan.kapoor@demobusiness.com', role: 'sales_manager', rbacRole: 'Sales Manager', title: 'Head of Sales' },
  { firstName: 'Priya', lastName: 'Singh', email: 'priya.singh@demobusiness.com', role: 'sales_rep', rbacRole: 'Sales Rep', title: 'Account Executive' },
  { firstName: 'Kunal', lastName: 'Sharma', email: 'kunal.sharma@demobusiness.com', role: 'sales_rep', rbacRole: 'Sales Rep', title: 'Sales Executive' },
  { firstName: 'Ananya', lastName: 'Iyer', email: 'ananya.iyer@demobusiness.com', role: 'sales_rep', rbacRole: 'Sales Rep', title: 'Business Development Executive' },
  { firstName: 'Vikram', lastName: 'Patel', email: 'vikram.patel@demobusiness.com', role: 'finance_manager', rbacRole: 'Finance Manager', title: 'Finance Manager' },
  { firstName: 'Meera', lastName: 'Nair', email: 'meera.nair@demobusiness.com', role: 'finance_analyst', rbacRole: 'Finance Analyst', title: 'Finance Analyst' },
  { firstName: 'Sanjay', lastName: 'Gupta', email: 'sanjay.gupta@demobusiness.com', role: 'hr_manager', rbacRole: 'HR Manager', title: 'HR Manager' },
  { firstName: 'Divya', lastName: 'Reddy', email: 'divya.reddy@demobusiness.com', role: 'hr_executive', rbacRole: 'HR Executive', title: 'HR Executive' },
  { firstName: 'Arjun', lastName: 'Menon', email: 'arjun.menon@demobusiness.com', role: 'marketing_manager', rbacRole: 'Marketing Manager', title: 'Marketing Manager' },
  { firstName: 'Kavita', lastName: 'Joshi', email: 'kavita.joshi@demobusiness.com', role: 'marketing_executive', rbacRole: 'Marketing Executive', title: 'Growth Marketer' },
  { firstName: 'Neha', lastName: 'Verma', email: 'neha.verma@demobusiness.com', role: 'support_manager', rbacRole: 'Support Manager', title: 'Customer Success Manager' },
  { firstName: 'Rahul', lastName: 'Choudhary', email: 'rahul.choudhary@demobusiness.com', role: 'support_agent', rbacRole: 'Support Agent', title: 'Support Specialist' },
  { firstName: 'Aditi', lastName: 'Malhotra', email: 'aditi.malhotra@demobusiness.com', role: 'operations_manager', rbacRole: 'Operations Manager', title: 'Operations Manager' },
  { firstName: 'Nikhil', lastName: 'Desai', email: 'nikhil.desai@demobusiness.com', role: 'operations_exec', rbacRole: 'Operations Executive', title: 'Operations Executive' },
  { firstName: 'Sneha', lastName: 'Kulkarni', email: 'sneha.kulkarni@demobusiness.com', role: 'project_manager', rbacRole: 'Project Manager', title: 'Project Manager' },
  { firstName: 'Aman', lastName: 'Saxena', email: 'aman.saxena@demobusiness.com', role: 'developer', rbacRole: 'Developer', title: 'Full Stack Developer' },
  { firstName: 'Pooja', lastName: 'Agarwal', email: 'pooja.agarwal@demobusiness.com', role: 'data_analyst', rbacRole: 'Data Analyst', title: 'Data Analyst' },
  { firstName: 'Harsh', lastName: 'Bansal', email: 'harsh.bansal@demobusiness.com', role: 'inventory_manager', rbacRole: 'Inventory Manager', title: 'Inventory Manager' },
]

const ROLE_ADMIN_SET = new Set(['Owner', 'Admin'])
const DEMO_ROLE_MODULE_BUNDLES: Record<string, string[]> = {
  Owner: [...DEMO_LICENSED_MODULES],
  Admin: [...DEMO_LICENSED_MODULES],
  'Sales Manager': ['crm', 'sales', 'analytics', 'communication'],
  'Sales Rep': ['crm', 'sales', 'communication'],
  'Finance Manager': ['finance', 'analytics'],
  'Finance Analyst': ['finance', 'analytics'],
  'HR Manager': ['hr', 'analytics'],
  'HR Executive': ['hr'],
  'Marketing Manager': ['marketing', 'crm', 'analytics'],
  'Marketing Executive': ['marketing', 'crm'],
  'Support Manager': ['crm', 'communication', 'projects', 'analytics'],
  'Support Agent': ['crm', 'communication'],
  'Operations Manager': ['inventory', 'projects', 'analytics'],
  'Operations Executive': ['inventory', 'projects'],
  'Project Manager': ['projects', 'crm', 'analytics'],
  Developer: ['projects', 'ai-studio', 'communication'],
  'Data Analyst': ['analytics'],
  'Inventory Manager': ['inventory', 'analytics', 'finance'],
}

async function provisionDemoWorkforce(tenantId: string, hashedPassword: string) {
  const prisma = getPrisma()

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      maxUsers: 100,
      licensedModules: DEMO_LICENSED_MODULES,
    },
  })

  const roleByName = new Map<string, string>()
  for (const roleName of Array.from(new Set(DEMO_EMPLOYEE_BLUEPRINTS.map((e) => e.rbacRole)))) {
    const role = await prisma.role.upsert({
      where: { tenantId_roleName: { tenantId, roleName } },
      update: {
        roleType: ROLE_ADMIN_SET.has(roleName) ? 'admin' : 'custom',
        isActive: true,
      },
      create: {
        tenantId,
        roleName,
        description: `${roleName} role for demo workforce`,
        roleType: ROLE_ADMIN_SET.has(roleName) ? 'admin' : 'custom',
        isSystem: ROLE_ADMIN_SET.has(roleName),
        isActive: true,
      },
    })
    roleByName.set(roleName, role.id)

    const roleBundle = new Set(DEMO_ROLE_MODULE_BUNDLES[roleName] || [])
    for (const moduleName of DEMO_LICENSED_MODULES) {
      const hasModuleAccess = ROLE_ADMIN_SET.has(roleName) || roleBundle.has(moduleName)
      const canAdmin = ROLE_ADMIN_SET.has(roleName)
      await prisma.moduleAccess.upsert({
        where: { tenantId_roleId_moduleName: { tenantId, roleId: role.id, moduleName } },
        update: {
          canView: hasModuleAccess,
          canCreate: hasModuleAccess,
          canEdit: hasModuleAccess,
          canDelete: canAdmin,
          canAdmin,
          viewScope: hasModuleAccess ? 'all' : 'none',
          editScope: hasModuleAccess ? (canAdmin ? 'all' : 'team') : 'none',
        },
        create: {
          tenantId,
          roleId: role.id,
          moduleName,
          canView: hasModuleAccess,
          canCreate: hasModuleAccess,
          canEdit: hasModuleAccess,
          canDelete: canAdmin,
          canAdmin,
          viewScope: hasModuleAccess ? 'all' : 'none',
          editScope: hasModuleAccess ? (canAdmin ? 'all' : 'team') : 'none',
        },
      })
    }
  }

  const users = []
  for (let idx = 0; idx < DEMO_EMPLOYEE_BLUEPRINTS.length; idx++) {
    const blueprint = DEMO_EMPLOYEE_BLUEPRINTS[idx]
    const fullName = `${blueprint.firstName} ${blueprint.lastName}`.trim()
    const user = await prisma.user.upsert({
      where: { email: blueprint.email },
      update: {
        name: fullName,
        password: hashedPassword,
        role: blueprint.role,
        tenantId,
      },
      create: {
        email: blueprint.email,
        name: fullName,
        password: hashedPassword,
        role: blueprint.role,
        tenantId,
      },
    })
    users.push(user)

    await prisma.tenantMember.upsert({
      where: { userId_tenantId: { userId: user.id, tenantId } },
      update: { role: blueprint.role },
      create: { userId: user.id, tenantId, role: blueprint.role },
    })

    const roleId = roleByName.get(blueprint.rbacRole)
    if (roleId) {
      await prisma.userRole.upsert({
        where: { tenantId_userId_roleId: { tenantId, userId: user.id, roleId } },
        update: { metadata: { seededBy: 'demo-business-master-seed', title: blueprint.title } },
        create: {
          tenantId,
          userId: user.id,
          roleId,
          metadata: { seededBy: 'demo-business-master-seed', title: blueprint.title },
        },
      })
    }

    await prisma.employee.upsert({
      where: {
        tenantId_officialEmail: { tenantId, officialEmail: blueprint.email },
      },
      update: {
        firstName: blueprint.firstName,
        lastName: blueprint.lastName,
        status: 'ACTIVE',
        userId: user.id,
      },
      create: {
        tenantId,
        userId: user.id,
        employeeCode: `DBPL-EMP-${String(idx + 1).padStart(3, '0')}`,
        firstName: blueprint.firstName,
        lastName: blueprint.lastName,
        officialEmail: blueprint.email,
        mobileCountryCode: '+91',
        mobileNumber: `900000${String(idx + 1).padStart(4, '0')}`,
        joiningDate: new Date('2025-03-01T00:00:00.000Z'),
        status: 'ACTIVE',
      },
    })

    if (blueprint.role.includes('sales') || blueprint.role === 'owner' || blueprint.role === 'admin') {
      await prisma.salesRep.upsert({
        where: { userId: user.id },
        update: { tenantId, isOnLeave: false },
        create: {
          userId: user.id,
          tenantId,
          specialization: blueprint.title,
          conversionRate: 0.12,
          isOnLeave: false,
        },
      })
    }
  }

  const adminUser =
    users.find((u) => u.email === 'admin@demo.com') ||
    users.find((u) => u.role === 'owner') ||
    users[0]
  return { users, adminUser }
}

export interface DemoBusinessSeedResult {
  crm: CRMSeedResult
  salesBilling: SalesBillingSeedResult
  marketing: MarketingSeedResult
  support: SupportSeedResult
  operations: OperationsSeedResult
  totalRecords: number
}

/**
 * Seed Products (needed before orders)
 */
async function seedProducts(tenantId: string) {
  const productData = [
    { name: 'Premium Widget', sku: 'WID-001', costPrice: 600, salePrice: 900, quantity: 100, category: 'Widgets' },
    { name: 'Standard Widget', sku: 'WID-002', costPrice: 300, salePrice: 450, quantity: 200, category: 'Widgets' },
    { name: 'Consulting Service', sku: 'SRV-001', costPrice: 0, salePrice: 5000, quantity: 0, category: 'Services' },
    { name: 'Enterprise Software License', sku: 'SW-001', costPrice: 5000, salePrice: 15000, quantity: 50, category: 'Software' },
    { name: 'Basic Software License', sku: 'SW-002', costPrice: 2000, salePrice: 8000, quantity: 100, category: 'Software' },
    { name: 'Annual Maintenance Contract', sku: 'AMC-001', costPrice: 0, salePrice: 25000, quantity: 0, category: 'Services' },
    { name: 'Training Program', sku: 'TRG-001', costPrice: 0, salePrice: 15000, quantity: 0, category: 'Services' },
    { name: 'Custom Development', sku: 'DEV-001', costPrice: 0, salePrice: 50000, quantity: 0, category: 'Services' },
    { name: 'Hardware Component A', sku: 'HW-001', costPrice: 1200, salePrice: 2000, quantity: 75, category: 'Hardware' },
    { name: 'Hardware Component B', sku: 'HW-002', costPrice: 800, salePrice: 1500, quantity: 120, category: 'Hardware' },
    { name: 'Support Package - Basic', sku: 'SUP-001', costPrice: 0, salePrice: 5000, quantity: 0, category: 'Services' },
    { name: 'Support Package - Premium', sku: 'SUP-002', costPrice: 0, salePrice: 15000, quantity: 0, category: 'Services' },
    { name: 'Data Migration Service', sku: 'MIG-001', costPrice: 0, salePrice: 30000, quantity: 0, category: 'Services' },
    { name: 'Cloud Hosting - Monthly', sku: 'HOST-001', costPrice: 500, salePrice: 2000, quantity: 0, category: 'Services' },
    { name: 'Cloud Hosting - Annual', sku: 'HOST-002', costPrice: 5000, salePrice: 20000, quantity: 0, category: 'Services' },
  ]

  // Create products sequentially to avoid connection pool exhaustion
  const products = []
  for (let idx = 0; idx < productData.length; idx++) {
    const product = productData[idx]
    const created = await getPrisma().product.upsert({
      where: { id: `product-${idx + 1}` },
      update: {},
      create: {
        id: `product-${idx + 1}`,
        tenantId,
        name: product.name,
        description: `High-quality ${product.name.toLowerCase()}`,
        sku: product.sku,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        quantity: product.quantity,
        categories: [product.category],
      },
    })
    products.push(created)
  }

  return products
}

/**
 * Main seeding function for Demo Business Pvt Ltd
 */
export async function seedDemoBusiness(demoTenantId?: string): Promise<DemoBusinessSeedResult> {
  console.log('🌱 Starting Demo Business Pvt Ltd comprehensive seeding...')
  console.log(`📅 Date Range: ${DEMO_DATE_RANGE.start.toISOString().split('T')[0]} to ${DEMO_DATE_RANGE.end.toISOString().split('T')[0]}`)
  console.log('')

  try {
    // 1. Get tenant - use provided tenantId if available, otherwise find by subdomain
    let tenant: any = null
    let tenantId: string

    if (demoTenantId) {
      // Use the provided tenantId directly
      console.log(`📋 Using provided tenantId: ${demoTenantId}`)
      try {
        tenant = await getPrisma().tenant.findUnique({
          where: { id: demoTenantId },
        })
        
        if (!tenant) {
          // Tenant doesn't exist - create new tenant
          // CRITICAL: Create tenant with requested ID if possible, otherwise Prisma will generate a new ID
          console.log(`📋 Tenant ${demoTenantId} not found, creating new Demo Business tenant...`)
          try {
            tenant = await getPrisma().tenant.create({
              data: {
                id: demoTenantId, // Try to use the requested ID
                name: 'Demo Business Pvt Ltd',
                subdomain: 'demo',
                plan: 'professional',
                status: 'active',
                maxContacts: 10000,
                maxInvoices: 10000,
                maxUsers: 50,
                maxStorage: 102400,
                gstin: '29ABCDE1234F1Z5',
                address: '123 Business Park, MG Road',
                city: 'Bangalore',
                state: 'Karnataka',
                postalCode: '560001',
                country: 'India',
                phone: '+91-80-12345678',
                email: 'contact@demobusiness.com',
                website: 'https://demobusiness.com',
                industry: 'service-business',
                industrySettings: {
                  setForDemo: true,
                  setAt: new Date().toISOString(),
                },
              },
            })
            console.log(`✅ Created new tenant: ${tenant.name} (${tenant.id})`)
            if (tenant.id !== demoTenantId) {
              console.log(`⚠️ Note: Created tenant ID ${tenant.id} differs from requested ${demoTenantId}`)
            }
          } catch (createError: any) {
            // If creating with specific ID fails (e.g., ID already exists or invalid format), 
            // fall back to finding existing Demo Business tenant
            if (createError?.code === 'P2002' || createError?.code === 'P2003') {
              console.log(`⚠️ Could not create tenant with ID ${demoTenantId}, checking for existing Demo Business tenant...`)
              tenant = await getPrisma().tenant.findFirst({
                where: {
                  OR: [
                    { name: { contains: 'Demo Business', mode: 'insensitive' } },
                    { subdomain: 'demo' },
                  ],
                },
              })
              if (tenant) {
                console.log(`✅ Found existing Demo Business tenant: ${tenant.name} (${tenant.id})`)
                console.log(`⚠️ WARNING: Using tenant ID ${tenant.id} instead of requested ${demoTenantId}`)
                console.log(`⚠️ Frontend should use tenant ID: ${tenant.id}`)
              } else {
                throw new Error(`Failed to create tenant ${demoTenantId} and no existing Demo Business tenant found: ${createError?.message || String(createError)}`)
              }
            } else {
              throw createError
            }
          }
        } else {
          console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})`)
          if (tenant.id !== demoTenantId) {
            console.log(`⚠️ WARNING: Found tenant ID ${tenant.id} differs from requested ${demoTenantId}`)
            console.log(`⚠️ Frontend should use tenant ID: ${tenant.id}`)
          }
        }
        
        tenantId = tenant.id // Use the actual tenant ID
      } catch (tenantError: any) {
        console.error(`❌ Error looking up/creating tenant ${demoTenantId}:`, tenantError?.message || tenantError)
        console.error(`❌ Error details:`, {
          code: tenantError?.code,
          name: tenantError?.name,
          stack: tenantError?.stack,
        })
        throw new Error(`Failed to find or create tenant ${demoTenantId}: ${tenantError?.message || String(tenantError)}`)
      }
    } else {
    // Fallback: find by subdomain
    tenant = await getPrisma().tenant.findUnique({
      where: { subdomain: 'demo' },
    })

    if (!tenant) {
      console.log('📋 Creating Demo Business tenant...')
      tenant = await getPrisma().tenant.create({
        data: {
          name: 'Demo Business Pvt Ltd',
          subdomain: 'demo',
          plan: 'professional',
          status: 'active',
          maxContacts: 10000,
          maxInvoices: 10000,
          maxUsers: 50,
          maxStorage: 102400,
          gstin: '29ABCDE1234F1Z5',
          address: '123 Business Park, MG Road',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
          phone: '+91-80-12345678',
          email: 'contact@demobusiness.com',
          website: 'https://demobusiness.com',
          industry: 'service-business',
          industrySettings: {
            setForDemo: true,
            setAt: new Date().toISOString(),
          },
        },
      })
    }

    tenantId = tenant.id
    console.log(`✅ Using tenant: ${tenant.name} (${tenantId})`)
  }
  
  console.log('')

  // 2. Ensure demo tenant has full module access
  const hashedPassword = await bcrypt.hash('Test@1234', 10)
  await getPrisma().tenant.update({
    where: { id: tenantId },
    data: {
      maxUsers: 100,
      licensedModules: DEMO_LICENSED_MODULES,
    },
  })

  // 3. RESET - Delete all existing demo data
  // NOTE: This deletes ALL data including current month data
  // Current month data will be recreated by ensureCurrentMonthData after seeding
  console.log('🗑️  Resetting existing demo data...')
  await resetDemoBusinessData(getPrisma(), tenantId)
  console.log('')

  const workforce = await provisionDemoWorkforce(tenantId, hashedPassword)
  const userId = workforce.adminUser.id
  console.log(`✅ Demo workforce ready: ${workforce.users.length} linked users/employees`)
  console.log(`✅ Using user: ${workforce.adminUser.name} (${userId})`)
  console.log('')

  // 3.5. Get SalesRep for admin user (required for CRM seeding assignment)
  const salesRep = await getPrisma().salesRep.findUnique({
    where: { userId },
  })
  if (!salesRep) {
    throw new Error(`SalesRep missing for admin user ${userId} after workforce provisioning`)
  }
  const salesRepId = salesRep.id
  console.log(`✅ Using SalesRep: ${salesRepId}`)
  console.log('')

  // 4. Seed Products (needed for orders)
  console.log('📦 Seeding Products...')
  const products = await seedProducts(tenantId)
  console.log(`  ✓ Created ${products.length} products`)
  console.log('')

  // 5. Seed CRM Module
  console.log('📇 Seeding CRM Module...')
  let crmResult: CRMSeedResult = {
    contacts: 0,
    deals: 0,
    tasks: 0,
    activities: 0,
    notes: 0,
    meetings: 0,
  }
  try {
    crmResult = await seedCRMModule(tenantId, userId, salesRepId, DEMO_DATE_RANGE, getPrisma())
    console.log(`  ✅ CRM Module seeded: ${crmResult.contacts} contacts, ${crmResult.deals} deals, ${crmResult.tasks} tasks`)
    
    // Verify deals were actually created
    const actualDealCount = await getPrisma().deal.count({ where: { tenantId } })
    const actualContactCount = await getPrisma().contact.count({ where: { tenantId } })
    
    if (actualContactCount === 0) {
      console.error(`  ❌ CRITICAL: CRM seed reported ${crmResult.contacts} contacts, but database shows 0 contacts!`)
      console.error(`  ❌ This indicates a database transaction rollback or connection issue`)
      throw new Error(`Contact creation failed: ${crmResult.contacts} reported but 0 in database`)
    }
    
    if (actualDealCount === 0) {
      console.error(`  ❌ CRITICAL: CRM seed reported ${crmResult.deals} deals, but database shows 0 deals!`)
      console.error(`  ❌ This indicates a database transaction rollback or connection issue`)
      // Don't throw if contacts exist - deals can be created later
      if (actualContactCount > 0) {
        console.warn(`  ⚠️  WARNING: Deals not created, but ${actualContactCount} contacts exist. You can create deals manually.`)
      } else {
        throw new Error(`Deal creation failed: ${crmResult.deals} reported but 0 in database, and no contacts exist`)
      }
    } else if (actualDealCount < crmResult.deals * 0.9) {
      console.warn(`  ⚠️  WARNING: CRM seed reported ${crmResult.deals} deals, but database shows only ${actualDealCount} deals`)
    } else {
      console.log(`  ✅ Verified: ${actualDealCount} deals exist in database`)
    }
  } catch (crmError: any) {
    console.error(`  ❌ CRM Module seeding FAILED:`, crmError?.message || String(crmError))
    console.error(`  ❌ Error code:`, crmError?.code || 'N/A')
    console.error(`  ❌ Error stack:`, crmError?.stack)
    
    // Check if we have any data at all
    const remainingContacts = await getPrisma().contact.count({ where: { tenantId } }).catch(() => 0)
    const remainingDeals = await getPrisma().deal.count({ where: { tenantId } }).catch(() => 0)
    
    if (remainingContacts === 0 && remainingDeals === 0) {
      console.error(`  ❌ CRITICAL: Seed failed and no data was created. Database is empty.`)
      console.error(`  ❌ This means the reset ran but seeding failed completely.`)
      throw new Error(`Seed failed completely: No contacts or deals created. Error: ${crmError?.message || String(crmError)}`)
    } else {
      console.warn(`  ⚠️  Partial seed: ${remainingContacts} contacts, ${remainingDeals} deals exist`)
      // Continue with other modules even if CRM partially failed
    }
    throw crmError
  }
  console.log('')

  // Get contacts and deals for other modules
  const contacts = await getPrisma().contact.findMany({ where: { tenantId }, take: 200 })
  const deals = await getPrisma().deal.findMany({ where: { tenantId }, take: 200 })

  // 5.5. Initialize Chart of Accounts (needed for Finance module)
  console.log('📊 Initializing Chart of Accounts...')
  try {
    const defaultAccounts = [
      // Assets
      { code: '101', name: 'Bank Account', type: 'asset', subType: 'cash', group: 'Current Assets' },
      { code: '120', name: 'Accounts Receivable', type: 'asset', subType: 'current_asset', group: 'Current Assets' },
      // Revenue
      { code: '401', name: 'Sales Revenue', type: 'revenue', group: 'Revenue' },
      // Expenses
      { code: '501', name: 'Travel Expenses', type: 'expense', group: 'Travel' },
      { code: '502', name: 'Office Expenses', type: 'expense', group: 'Office' },
      { code: '503', name: 'Marketing Expenses', type: 'expense', group: 'Marketing' },
      { code: '504', name: 'Utilities', type: 'expense', group: 'Utilities' },
      { code: '505', name: 'Rent', type: 'expense', group: 'Rent' },
      { code: '599', name: 'Other Expenses', type: 'expense', group: 'Other' },
    ]

    for (const account of defaultAccounts) {
      try {
        await getPrisma().chartOfAccounts.upsert({
          where: {
            tenantId_accountCode: {
              tenantId,
              accountCode: account.code,
            },
          },
          create: {
            tenantId,
            accountCode: account.code,
            accountName: account.name,
            accountType: account.type as any,
            subType: account.subType as any,
            accountGroup: account.group,
            currency: 'INR',
            isActive: true,
          },
          update: {
            accountName: account.name,
            isActive: true,
          },
        })
      } catch (accountError: any) {
        // If table doesn't exist, log warning and continue
        if (accountError?.code === 'P2021') {
          console.warn(`  ⚠️  Chart of Accounts table does not exist. Skipping account initialization.`)
          console.warn(`  ⚠️  Run database migrations to create the table.`)
          break
        }
        throw accountError
      }
    }
    console.log(`  ✓ Initialized chart of accounts`)
  } catch (chartError: any) {
    console.warn(`  ⚠️  Failed to initialize chart of accounts:`, chartError?.message || chartError)
    console.warn(`  ⚠️  Finance module may not work correctly until chart_of_accounts table is created.`)
  }
  console.log('')

  // 6. Seed Sales & Billing Module
  console.log('💰 Seeding Sales & Billing Module...')
  const salesBillingResult = await seedSalesAndBillingModule(tenantId, contacts, products, DEMO_DATE_RANGE, prisma)
  console.log('')

  // 7. Seed Marketing Module
  console.log('📢 Seeding Marketing Module...')
  const marketingResult = await seedMarketingModule(tenantId, contacts, DEMO_DATE_RANGE, getPrisma())
  console.log('')

  // 8. Seed Support Module
  console.log('🎫 Seeding Support Module...')
  const supportResult = await seedSupportModule(tenantId, contacts, userId, DEMO_DATE_RANGE, getPrisma())
  console.log('')

  // 9. Seed Operations Module
  console.log('⚙️  Seeding Operations Module...')
  const operationsResult = await seedOperationsModule(tenantId, userId, DEMO_DATE_RANGE, getPrisma())
  console.log('')

  // 10. Summary
  const totalRecords = 
    crmResult.contacts + crmResult.deals + crmResult.tasks + crmResult.activities +
    salesBillingResult.orders + salesBillingResult.invoices + salesBillingResult.payments +
    marketingResult.campaigns + marketingResult.landingPages + marketingResult.leadSources +
    supportResult.tickets + supportResult.replies +
    operationsResult.auditLogs + operationsResult.automationRuns + operationsResult.notifications

  const result: DemoBusinessSeedResult = {
    crm: crmResult,
    salesBilling: salesBillingResult,
    marketing: marketingResult,
    support: supportResult,
    operations: operationsResult,
    totalRecords,
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Demo Business Pvt Ltd Seeding Complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('📊 Summary:')
  console.log(`  CRM: ${crmResult.contacts} contacts, ${crmResult.deals} deals, ${crmResult.tasks} tasks`)
  console.log(`  Sales: ${salesBillingResult.orders} orders, ${salesBillingResult.invoices} invoices`)
  console.log(`  Marketing: ${marketingResult.campaigns} campaigns, ${marketingResult.landingPages} landing pages`)
  console.log(`  Support: ${supportResult.tickets} tickets, ${supportResult.replies} replies`)
  console.log(`  Operations: ${operationsResult.auditLogs} audit logs, ${operationsResult.automationRuns} automation runs`)
  console.log(`  Total Records: ${totalRecords}`)
  console.log('')
  console.log('📋 Test Credentials:')
  console.log('  Email: admin@demo.com')
  console.log('  Password: Test@1234')
  console.log('  Subdomain: demo')
  console.log('')
  console.log(`📅 Data Range: ${DEMO_DATE_RANGE.start.toISOString().split('T')[0]} to ${DEMO_DATE_RANGE.end.toISOString().split('T')[0]}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  return result
  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ Demo Business Seeding FAILED!')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('Error type:', error?.constructor?.name || typeof error)
    console.error('Error message:', error?.message || String(error))
    console.error('Error code:', error?.code || 'N/A')
    if (error?.stack) {
      console.error('Error stack:', error.stack)
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    throw error
  }
}

// CLI entry point
if (require.main === module) {
  seedDemoBusiness()
    .then(() => {
      console.log('✅ Seeding completed successfully')
      process.exit(0)
    })
    .catch((e) => {
      console.error('❌ Seeding failed:', e)
      process.exit(1)
    })
    .finally(async () => {
      await getPrisma().$disconnect()
    })
}
