/**
 * Seed Super Admin and Business Admin users for testing.
 * Run: npm run seed:admin-users
 *
 * Creates:
 * 1. Super Admin – admin@payaidpayments.com (role: super_admin)
 * 2. Business Admin – businessadmin@demobusiness.com (role: admin) in Demo Business tenant
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SUPER_ADMIN_EMAIL = 'admin@payaidpayments.com'
const SUPER_ADMIN_NAME = 'PayAid Super Admin'
const SUPER_ADMIN_PASSWORD = 'PayAid_SuperAdmin_2025!'

const BUSINESS_ADMIN_EMAIL = 'businessadmin@demobusiness.com'
const BUSINESS_ADMIN_NAME = 'Business Admin'
const BUSINESS_ADMIN_PASSWORD = 'BusinessAdmin_2025!'

async function main() {
  console.log('Seeding Super Admin and Business Admin users...\n')

  const saltRounds = 10
  const superAdminHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, saltRounds)
  const businessAdminHash = await bcrypt.hash(BUSINESS_ADMIN_PASSWORD, saltRounds)

  // 1. PayAid Platform tenant (for Super Admin), or use first existing tenant if create fails (e.g. pooler)
  let payaidTenant: { id: string }
  try {
    payaidTenant = await prisma.tenant.upsert({
      where: { subdomain: 'payaid-platform' },
      update: {},
      create: {
        name: 'PayAid Platform',
        subdomain: 'payaid-platform',
        plan: 'enterprise',
        status: 'active',
        maxUsers: 100,
        maxContacts: 0,
        maxInvoices: 0,
        maxStorage: 10240,
        industry: 'professional-services',
        country: 'India',
      },
    })
  } catch (e) {
    const existing = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!existing) throw new Error('No tenant found and could not create PayAid Platform. Ensure DB is reachable (use DIRECT_URL if using Supabase pooler).')
    payaidTenant = existing
    console.log('Using existing tenant for Super Admin:', payaidTenant.id)
  }
  console.log('PayAid Platform tenant:', payaidTenant.id)

  // 2. Super Admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    update: {
      name: SUPER_ADMIN_NAME,
      password: superAdminHash,
      role: 'super_admin',
      tenantId: payaidTenant.id,
    },
    create: {
      email: SUPER_ADMIN_EMAIL,
      name: SUPER_ADMIN_NAME,
      password: superAdminHash,
      role: 'super_admin',
      tenantId: payaidTenant.id,
    },
  })
  console.log('Super Admin user created/updated:', superAdmin.email)

  // 3. Demo Business tenant (for Business Admin) – use existing 'demo' if present
  let demoTenant = await prisma.tenant.findUnique({
    where: { subdomain: 'demo' },
  })
  if (!demoTenant) {
    demoTenant = await prisma.tenant.upsert({
      where: { subdomain: 'demo' },
      update: {},
      create: {
        name: 'Demo Business Pvt Ltd',
        subdomain: 'demo',
        plan: 'professional',
        status: 'active',
        maxUsers: 10,
        maxContacts: 1000,
        maxInvoices: 1000,
        maxStorage: 10240,
        industry: 'service-business',
        country: 'India',
        licensedModules: ['crm', 'finance', 'marketing', 'hr', 'projects', 'analytics'],
      },
    })
  }
  console.log('Demo Business tenant:', demoTenant.id)

  // 4. Business Admin user
  const businessAdmin = await prisma.user.upsert({
    where: { email: BUSINESS_ADMIN_EMAIL },
    update: {
      name: BUSINESS_ADMIN_NAME,
      password: businessAdminHash,
      role: 'admin',
      tenantId: demoTenant.id,
    },
    create: {
      email: BUSINESS_ADMIN_EMAIL,
      name: BUSINESS_ADMIN_NAME,
      password: businessAdminHash,
      role: 'admin',
      tenantId: demoTenant.id,
    },
  })
  console.log('Business Admin user created/updated:', businessAdmin.email)

  console.log('\n--- Credentials for testing ---\n')
  console.log('SUPER ADMIN (PayAid team – access /super-admin)')
  console.log('  Email:    ', SUPER_ADMIN_EMAIL)
  console.log('  User ID:  PayAid_SuperAdmin')
  console.log('  Password: ', SUPER_ADMIN_PASSWORD)
  console.log('  Login at: /login then open /super-admin\n')
  console.log('BUSINESS ADMIN (tenant admin – access /admin)')
  console.log('  Email:    ', BUSINESS_ADMIN_EMAIL)
  console.log('  Password: ', BUSINESS_ADMIN_PASSWORD)
  console.log('  Login at: /login then open /admin\n')
  console.log('Done.')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
