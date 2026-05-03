import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Checking if User table exists...\n')
    
    // Try to query users
    const users = await prisma.user.findMany({ take: 1 })
    console.log(`✅ User table exists! Found ${users.length} users`)
    
    // Check for admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' }
    })
    
    if (admin) {
      console.log('✅ Admin user exists!')
      console.log(`   Email: ${admin.email}`)
      console.log(`   Name: ${admin.name}`)
      console.log(`   Has password: ${!!admin.password}`)
    } else {
      console.log('❌ Admin user does NOT exist')
      console.log('💡 Need to create admin user')
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.message.includes('does not exist')) {
      console.log('\n💡 The User table does not exist in the database')
      console.log('💡 Run: npx prisma db push')
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

