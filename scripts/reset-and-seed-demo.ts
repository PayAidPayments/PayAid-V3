import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetAndSeed() {
  console.log('🗑️  Clearing existing demo data...')
  
  // Find demo tenant
  const demoTenant = await prisma.tenant.findUnique({
    where: { subdomain: 'demo' },
  })

  if (!demoTenant) {
    console.log('❌ Demo tenant not found. Running seed will create it.')
    await prisma.$disconnect()
    process.exit(0)
  }

  console.log(`📋 Found demo tenant: ${demoTenant.name} (${demoTenant.id})`)

  // Delete in reverse order of dependencies
  const deleteOperations = [
    // Order items first
    () => prisma.orderItem.deleteMany({ where: { order: { tenantId: demoTenant.id } } }),
    () => prisma.order.deleteMany({ where: { tenantId: demoTenant.id } }),
    
    // Invoices
    () => prisma.invoice.deleteMany({ where: { tenantId: demoTenant.id } }),
    
    // Tasks
    () => prisma.task.deleteMany({ where: { tenantId: demoTenant.id } }),
    
    // Deals
    () => prisma.deal.deleteMany({ where: { tenantId: demoTenant.id } }),
    
    // Contacts
    () => prisma.contact.deleteMany({ where: { tenantId: demoTenant.id } }),
    
    // Products
    () => prisma.product.deleteMany({ where: { tenantId: demoTenant.id } }),
    
    // Email & Chat
    () => prisma.emailMessage.deleteMany({ where: { account: { tenantId: demoTenant.id } } }),
    () => prisma.emailFolder.deleteMany({ where: { account: { tenantId: demoTenant.id } } }),
    () => prisma.emailAccount.deleteMany({ where: { tenantId: demoTenant.id } }),
    () => prisma.chatChannelMessage.deleteMany({ where: { channel: { workspace: { tenantId: demoTenant.id } } } }),
    () => prisma.chatChannelMember.deleteMany({ where: { channel: { workspace: { tenantId: demoTenant.id } } } }),
    () => prisma.chatChannel.deleteMany({ where: { workspace: { tenantId: demoTenant.id } } }),
    () => prisma.chatMember.deleteMany({ where: { workspace: { tenantId: demoTenant.id } } }),
    () => prisma.chatWorkspace.deleteMany({ where: { tenantId: demoTenant.id } }),
  ]

  for (const op of deleteOperations) {
    try {
      const result = await op()
      console.log(`  ✓ Deleted ${result.count} records`)
    } catch (error: any) {
      console.log(`  ⚠️  Error: ${error.message}`)
    }
  }

  console.log('✅ Demo data cleared!')
  console.log('🌱 Now run: npm run db:seed')
  
  await prisma.$disconnect()
}

resetAndSeed()
  .catch((e) => {
    console.error('❌ Reset failed:', e)
    process.exit(1)
  })
