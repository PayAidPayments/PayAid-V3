import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking dashboard data...\n')

  // Get demo tenant
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: 'demo' },
  })

  if (!tenant) {
    console.log('❌ Demo tenant not found!')
    console.log('📋 Run: npm run db:seed\n')
    await prisma.$disconnect()
    return
  }

  console.log('✅ Tenant found:', tenant.name)
  console.log('   Tenant ID:', tenant.id)
  console.log('   Subdomain:', tenant.subdomain)
  console.log('')

  // Count data
  const [contacts, deals, orders, invoices, tasks] = await Promise.all([
    prisma.contact.count({ where: { tenantId: tenant.id } }),
    prisma.deal.count({ where: { tenantId: tenant.id } }),
    prisma.order.count({ where: { tenantId: tenant.id } }),
    prisma.invoice.count({ where: { tenantId: tenant.id } }),
    prisma.task.count({ where: { tenantId: tenant.id } }),
  ])

  console.log('📊 Data Counts:')
  console.log('   Contacts:', contacts)
  console.log('   Deals:', deals)
  console.log('   Orders:', orders)
  console.log('   Invoices:', invoices)
  console.log('   Tasks:', tasks)
  console.log('')

  if (contacts === 0 && deals === 0 && orders === 0) {
    console.log('⚠️  No data found! Re-seeding database...\n')
    await prisma.$disconnect()
    return
  }

  console.log('✅ Data exists! Dashboard should work.')
  console.log('')
  console.log('💡 If dashboard still shows 0:')
  console.log('   1. Check browser console for errors')
  console.log('   2. Check server logs for API errors')
  console.log('   3. Verify you logged in with admin@demo.com')
  console.log('   4. Refresh the dashboard page')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
