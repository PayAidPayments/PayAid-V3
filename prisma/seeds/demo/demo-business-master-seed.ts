/**
 * Master Demo Business Seeder
 * Orchestrates seeding of all modules for Demo Business Pvt Ltd
 * Date Range: March 2025 - February 2026
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { DEMO_DATE_RANGE } from './date-utils'
import { resetDemoBusinessData } from './reset-demo-business'
import { seedCRMModule, CRMSeedResult } from './seed-crm'
import { seedSalesAndBillingModule, SalesBillingSeedResult } from './seed-sales-billing'
import { seedMarketingModule, MarketingSeedResult } from './seed-marketing'
import { seedSupportModule, SupportSeedResult } from './seed-support'
import { seedOperationsModule, OperationsSeedResult } from './seed-operations'

const prisma = new PrismaClient()

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
    const created = await prisma.product.upsert({
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

  // 1. Get or create Demo Business tenant
  let tenant = await prisma.tenant.findUnique({
    where: { subdomain: 'demo' },
  })

  if (!tenant) {
    console.log('📋 Creating Demo Business tenant...')
    tenant = await prisma.tenant.create({
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

  const tenantId = demoTenantId || tenant.id
  console.log(`✅ Using tenant: ${tenant.name} (${tenantId})`)
  console.log('')

  // 2. Get or create admin user
  const hashedPassword = await bcrypt.hash('Test@1234', 10)
  let user = await prisma.user.findUnique({
    where: { email: 'admin@demo.com' },
  })

  if (!user) {
    console.log('👤 Creating admin user...')
    user = await prisma.user.create({
      data: {
        email: 'admin@demo.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'owner',
        tenantId,
      },
    })
  }

  const userId = user.id
  console.log(`✅ Using user: ${user.name} (${userId})`)
  console.log('')

  // 3. RESET - Delete all existing demo data
  console.log('🗑️  Resetting existing demo data...')
  await resetDemoBusinessData(prisma, tenantId)
  console.log('')

  // 4. Seed Products (needed for orders)
  console.log('📦 Seeding Products...')
  const products = await seedProducts(tenantId)
  console.log(`  ✓ Created ${products.length} products`)
  console.log('')

  // 5. Seed CRM Module
  console.log('📇 Seeding CRM Module...')
  const crmResult = await seedCRMModule(tenantId, userId, DEMO_DATE_RANGE, prisma)
  console.log('')

  // Get contacts and deals for other modules
  const contacts = await prisma.contact.findMany({ where: { tenantId }, take: 200 })
  const deals = await prisma.deal.findMany({ where: { tenantId }, take: 200 })

  // 6. Seed Sales & Billing Module
  console.log('💰 Seeding Sales & Billing Module...')
  const salesBillingResult = await seedSalesAndBillingModule(tenantId, contacts, products, DEMO_DATE_RANGE, prisma)
  console.log('')

  // 7. Seed Marketing Module
  console.log('📢 Seeding Marketing Module...')
  const marketingResult = await seedMarketingModule(tenantId, contacts, DEMO_DATE_RANGE, prisma)
  console.log('')

  // 8. Seed Support Module
  console.log('🎫 Seeding Support Module...')
  const supportResult = await seedSupportModule(tenantId, contacts, userId, DEMO_DATE_RANGE, prisma)
  console.log('')

  // 9. Seed Operations Module
  console.log('⚙️  Seeding Operations Module...')
  const operationsResult = await seedOperationsModule(tenantId, userId, DEMO_DATE_RANGE, prisma)
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
      await prisma.$disconnect()
    })
}
