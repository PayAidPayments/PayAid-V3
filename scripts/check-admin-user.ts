/**
 * Check Admin User Script
 * Verifies if admin@demo.com user exists and can login
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking admin user...\n')

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            status: true,
          },
        },
      },
    })

    if (!user) {
      console.log('❌ User NOT FOUND: admin@demo.com')
      console.log('\n💡 Solution: Run database seed')
      console.log('   npm run db:seed')
      return
    }

    console.log('✅ User FOUND:')
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`)
    console.log(`   Tenant ID: ${user.tenantId || 'None'}`)

    if (user.tenant) {
      console.log(`\n✅ Tenant Info:`)
      console.log(`   Name: ${user.tenant.name}`)
      console.log(`   Subdomain: ${user.tenant.subdomain}`)
      console.log(`   Status: ${user.tenant.status}`)
    } else {
      console.log('\n⚠️  No tenant associated with user')
    }

    // Test password
    if (user.password) {
      const testPassword = 'Test@1234'
      const isValid = await bcrypt.compare(testPassword, user.password)
      
      console.log(`\n🔐 Password Test:`)
      console.log(`   Test Password: ${testPassword}`)
      console.log(`   Password Valid: ${isValid ? '✅ Yes' : '❌ No'}`)
      
      if (!isValid) {
        console.log('\n💡 Solution: Reset password or re-seed database')
        console.log('   npm run db:seed')
      }
    } else {
      console.log('\n⚠️  User has no password set')
      console.log('💡 Solution: Run database seed')
      console.log('   npm run db:seed')
    }

    // Check database connection
    const userCount = await prisma.user.count()
    const tenantCount = await prisma.tenant.count()
    
    console.log(`\n📊 Database Stats:`)
    console.log(`   Total Users: ${userCount}`)
    console.log(`   Total Tenants: ${tenantCount}`)

  } catch (error) {
    console.error('❌ Error checking user:', error)
    console.log('\n💡 Possible issues:')
    console.log('   1. Database not running')
    console.log('   2. Database not initialized')
    console.log('   3. Connection string incorrect')
    console.log('\n💡 Solutions:')
    console.log('   1. Start PostgreSQL: docker-compose up -d postgres')
    console.log('   2. Run migrations: npm run db:migrate')
    console.log('   3. Seed database: npm run db:seed')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

