/**
 * Add shared demo data for the demo tenant used by ALL modules:
 * - Home: Today's overview, Receivables, Team activity, Active employees, AI Briefing
 * - HR / Payroll: same Employee records (with Department + Designation)
 * - CRM: same Deal and Task records
 * - Finance: same Invoice records
 *
 * Single source of truth: we do NOT add separate "home-only" data. Counts on Home,
 * HR employees list, CRM deals/tasks, and Finance invoices all read these same records.
 * Only INSERTS or upserts by fixed IDs — never deletes or overwrites existing data.
 *
 * Usage: npx tsx scripts/seed-demo-home-data.ts
 * Or:    npm run seed:demo-home-data
 *
 * Requires: DATABASE_URL in .env (or use npm run db:local:setup for local DB first).
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load .env from project root so DATABASE_URL is set when run via npm
config({ path: process.env.ENV_FILE || '.env' })

const prisma = new PrismaClient()

const ADDITIVE_PREFIX = 'add-demo-home'

async function main() {
  console.log('🌱 Adding shared demo data for all modules (no existing data will be deleted)...\n')

  let tenant
  try {
    tenant = await prisma.tenant.findFirst({
      where: { subdomain: 'demo' },
      include: { users: { take: 1 } },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('Tenant or user not found') || msg.includes('FATAL') || msg.includes('connection')) {
      console.error('❌ Database connection failed. The server rejected the connection (e.g. invalid user/project).\n')
      console.error('   • Ensure .env has a valid DATABASE_URL (and DIRECT_URL if using Supabase).')
      console.error('   • For local DB: npm run db:local:up && npm run db:local:setup')
      console.error('   • Verify: npm run verify:db')
      process.exit(1)
    }
    throw err
  }

  if (!tenant) {
    console.log('⚠️  Demo tenant (subdomain: demo) not found. Run main seed first: npm run db:seed')
    return
  }

  const userId = tenant.users[0]?.id ?? null
  if (!userId) {
    console.log('⚠️  No user found for demo tenant. Run main seed first.')
    return
  }

  let contacts = await prisma.contact.findMany({
    where: { tenantId: tenant.id },
    take: 5,
    orderBy: { createdAt: 'asc' },
  })

  if (contacts.length === 0) {
    console.log('  Creating 2 contacts for demo tenant...')
    const [c1, c2] = await Promise.all([
      prisma.contact.create({
        data: {
          id: `${ADDITIVE_PREFIX}-contact-1`,
          tenantId: tenant.id,
          name: 'Demo Contact One',
          email: 'demo1@demobusiness.com',
          phone: '+91-9876500001',
          company: 'Demo Company A',
          type: 'customer',
          status: 'active',
          address: '1 Demo Street',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      }),
      prisma.contact.create({
        data: {
          id: `${ADDITIVE_PREFIX}-contact-2`,
          tenantId: tenant.id,
          name: 'Demo Contact Two',
          email: 'demo2@demobusiness.com',
          phone: '+91-9876500002',
          company: 'Demo Company B',
          type: 'customer',
          status: 'active',
          address: '2 Demo Avenue',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
        },
      }),
    ])
    contacts = [c1, c2]
    console.log('  ✓ Contacts created')
  }

  const contactId = contacts[0].id
  const now = new Date()

  // ——— HR supporting data: Department + Designation (same tenant; used by HR/Payroll) ———
  const dept = await prisma.department.upsert({
    where: {
      tenantId_name: { tenantId: tenant.id, name: 'General' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'General',
      code: 'GEN',
      isActive: true,
    },
  })
  const designation = await prisma.designation.upsert({
    where: {
      tenantId_name: { tenantId: tenant.id, name: 'Staff' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Staff',
      code: 'STF',
      isActive: true,
    },
  })
  console.log('  ✓ Department & Designation ensured (for HR/Payroll)')

  // ——— Employees (shared: Home "Active employees" + HR/Payroll list show same count) ———
  const employeeCodes = ['DEMO-HOME-1', 'DEMO-HOME-2', 'DEMO-HOME-3']
  for (let i = 0; i < employeeCodes.length; i++) {
    const code = employeeCodes[i]
    const email = `demo-home-${i + 1}@demobusiness.com`
    await prisma.employee.upsert({
      where: {
        tenantId_employeeCode: { tenantId: tenant.id, employeeCode: code },
      },
      update: { departmentId: dept.id, designationId: designation.id },
      create: {
        tenantId: tenant.id,
        employeeCode: code,
        firstName: `Demo`,
        lastName: `Employee ${i + 1}`,
        officialEmail: email,
        mobileCountryCode: '+91',
        mobileNumber: `987650000${i + 3}`,
        joiningDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        departmentId: dept.id,
        designationId: designation.id,
      },
    })
  }
  console.log('  ✓ Employees ensured (3 active; same records on Home & HR/Payroll)')

  // ——— Deals (open so pipeline value and counts show) ———
  await prisma.deal.upsert({
    where: { id: `${ADDITIVE_PREFIX}-deal-1` },
    update: {},
    create: {
      id: `${ADDITIVE_PREFIX}-deal-1`,
      tenantId: tenant.id,
      name: 'Demo Home Deal - Pipeline',
      value: 75000,
      stage: 'negotiation',
      probability: 70,
      expectedCloseDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      contactId,
    },
  })
  await prisma.deal.upsert({
    where: { id: `${ADDITIVE_PREFIX}-deal-2` },
    update: {},
    create: {
      id: `${ADDITIVE_PREFIX}-deal-2`,
      tenantId: tenant.id,
      name: 'Demo Home Deal - Qualified',
      value: 50000,
      stage: 'qualified',
      probability: 45,
      expectedCloseDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      contactId,
    },
  })
  console.log('  ✓ Deals ensured (2 open; same records on Home & CRM)')

  // ——— Tasks (pending so overdue/pending task count shows) ———
  await prisma.task.upsert({
    where: { id: `${ADDITIVE_PREFIX}-task-1` },
    update: {},
    create: {
      id: `${ADDITIVE_PREFIX}-task-1`,
      tenantId: tenant.id,
      title: 'Demo Home Task - Follow up',
      description: 'Added for home dashboard demo',
      status: 'pending',
      priority: 'medium',
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      contactId,
      assignedToId: userId,
    },
  })
  await prisma.task.upsert({
    where: { id: `${ADDITIVE_PREFIX}-task-2` },
    update: {},
    create: {
      id: `${ADDITIVE_PREFIX}-task-2`,
      tenantId: tenant.id,
      title: 'Demo Home Task - Review',
      description: 'Added for home dashboard demo',
      status: 'in_progress',
      priority: 'high',
      dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      contactId,
      assignedToId: userId,
    },
  })
  console.log('  ✓ Tasks ensured (2 pending; same records on Home & CRM)')

  // ——— Invoices (sent so receivables / pending count shows; 1 sent, 1 paid) ———
  const invDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
  const dueDate = new Date(invDate.getTime() + 30 * 24 * 60 * 60 * 1000)
  const totalSent = 85000
  const subtotalSent = totalSent / 1.18
  const taxSent = totalSent - subtotalSent

  await prisma.invoice.upsert({
    where: { id: `${ADDITIVE_PREFIX}-inv-1` },
    update: {},
    create: {
      id: `${ADDITIVE_PREFIX}-inv-1`,
      tenantId: tenant.id,
      invoiceNumber: 'INV-DEMO-HOME-001',
      status: 'sent',
      subtotal: subtotalSent,
      tax: taxSent,
      total: totalSent,
      gstRate: 18,
      gstAmount: taxSent,
      invoiceDate: invDate,
      dueDate,
      customerId: contactId,
    },
  })

  const totalPaid = 45000
  const subtotalPaid = totalPaid / 1.18
  const taxPaid = totalPaid - subtotalPaid
  const paidDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
  await prisma.invoice.upsert({
    where: { id: `${ADDITIVE_PREFIX}-inv-2` },
    update: {},
    create: {
      id: `${ADDITIVE_PREFIX}-inv-2`,
      tenantId: tenant.id,
      invoiceNumber: 'INV-DEMO-HOME-002',
      status: 'paid',
      subtotal: subtotalPaid,
      tax: taxPaid,
      total: totalPaid,
      gstRate: 18,
      gstAmount: taxPaid,
      invoiceDate: new Date(paidDate.getTime() - 15 * 24 * 60 * 60 * 1000),
      dueDate: new Date(paidDate.getTime() + 10 * 24 * 60 * 60 * 1000),
      paidAt: paidDate,
      customerId: contactId,
    },
  })
  console.log('  ✓ Invoices ensured (1 sent, 1 paid; same records on Home & Finance)')

  console.log('\n✅ Shared demo data added. No existing data was deleted.')
  console.log('   Same data is used across: Home, HR/Payroll (employees), CRM (deals/tasks), Finance (invoices).')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
