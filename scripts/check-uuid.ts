/**
 * Check UUID Script
 * Finds what record this UUID refers to
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const uuid = 'ef3602f5-2686-4021-b724-0fee87e72c32'

async function main() {
  console.log(`🔍 Searching for UUID: ${uuid}\n`)

  try {
    // Check User table
    const user = await prisma.user.findUnique({
      where: { id: uuid },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    })

    if (user) {
      console.log('✅ Found in User table:')
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Role: ${user.role}`)
      if (user.tenant) {
        console.log(`   Tenant: ${user.tenant.name} (${user.tenant.subdomain})`)
      }
      return
    }

    // Check Tenant table
    const tenant = await prisma.tenant.findUnique({
      where: { id: uuid },
      include: {
        _count: {
          select: {
            users: true,
            contacts: true,
            invoices: true,
          },
        },
      },
    })

    if (tenant) {
      console.log('✅ Found in Tenant table:')
      console.log(`   ID: ${tenant.id}`)
      console.log(`   Name: ${tenant.name}`)
      console.log(`   Subdomain: ${tenant.subdomain}`)
      console.log(`   Status: ${tenant.status}`)
      console.log(`   Plan: ${tenant.plan}`)
      console.log(`   Users: ${tenant._count.users}`)
      console.log(`   Contacts: ${tenant._count.contacts}`)
      console.log(`   Invoices: ${tenant._count.invoices}`)
      return
    }

    // Check Order table
    const order = await prisma.order.findUnique({
      where: { id: uuid },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (order) {
      console.log('✅ Found in Order table:')
      console.log(`   ID: ${order.id}`)
      console.log(`   Order Number: ${order.orderNumber}`)
      console.log(`   Status: ${order.status}`)
      console.log(`   Total: ₹${order.total}`)
      console.log(`   Tenant: ${order.tenant?.name || 'N/A'}`)
      return
    }

    // Check Subscription table
    const subscription = await prisma.subscription.findUnique({
      where: { id: uuid },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (subscription) {
      console.log('✅ Found in Subscription table:')
      console.log(`   ID: ${subscription.id}`)
      console.log(`   Tenant: ${subscription.tenant.name}`)
      console.log(`   Tier: ${subscription.tier}`)
      console.log(`   Status: ${subscription.status}`)
      console.log(`   Modules: ${subscription.modules.join(', ')}`)
      return
    }

    // Check Contact table
    const contact = await prisma.contact.findUnique({
      where: { id: uuid },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (contact) {
      console.log('✅ Found in Contact table:')
      console.log(`   ID: ${contact.id}`)
      console.log(`   Name: ${contact.name}`)
      console.log(`   Email: ${contact.email}`)
      console.log(`   Type: ${contact.type}`)
      console.log(`   Tenant: ${contact.tenant.name}`)
      return
    }

    // Check Invoice table
    const invoice = await prisma.invoice.findUnique({
      where: { id: uuid },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (invoice) {
      console.log('✅ Found in Invoice table:')
      console.log(`   ID: ${invoice.id}`)
      console.log(`   Invoice Number: ${invoice.invoiceNumber}`)
      console.log(`   Status: ${invoice.status}`)
      console.log(`   Total: ₹${invoice.total}`)
      console.log(`   Tenant: ${invoice.tenant.name}`)
      return
    }

    console.log('❌ UUID not found in any table')
    console.log('\n💡 Possible reasons:')
    console.log('   1. Database not initialized')
    console.log('   2. Record doesn\'t exist')
    console.log('   3. UUID is from a different table')
    console.log('\n💡 Try:')
    console.log('   npm run db:migrate')
    console.log('   npm run db:seed')

  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log('❌ Database tables don\'t exist')
      console.log('\n💡 Run migrations first:')
      console.log('   npm run db:migrate')
      console.log('   npm run db:seed')
    } else {
      console.error('❌ Error:', error.message)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

