/**
 * Quick script to check database and seed if empty
 * Run: npx tsx scripts/check-and-seed-dashboard.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking database...\n')
  
  try {
    const tenantCount = await prisma.tenant.count()
    const userCount = await prisma.user.count()
    const subscriptionCount = await prisma.subscription.count()
    
    console.log(`Current data:`)
    console.log(`  Tenants: ${tenantCount}`)
    console.log(`  Users: ${userCount}`)
    console.log(`  Subscriptions: ${subscriptionCount}\n`)
    
    if (tenantCount === 0) {
      console.log('⚠️  Database is empty! Dashboard will show all zeros.\n')
      console.log('To seed data, run one of:')
      console.log('  1. npm run seed:admin-users  (creates Super Admin user)')
      console.log('  2. npm run seed:demo-business  (creates demo tenant + data)')
      console.log('  3. Visit: http://localhost:3000/api/admin/seed-demo-data\n')
      console.log('Note: If you get "Tenant or user not found" error, check your DATABASE_URL/DIRECT_URL in .env')
    } else {
      console.log('✅ Database has data. Dashboard should show metrics.')
    }
  } catch (e) {
    console.error('❌ Database connection error:', e instanceof Error ? e.message : e)
    console.log('\nCheck your DATABASE_URL in .env file')
    console.log('If using Supabase, ensure DIRECT_URL is set for migrations/seeds')
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
