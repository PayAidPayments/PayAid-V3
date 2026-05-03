import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking login credentials...\n')

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email: 'admin@demo.com' },
    include: { tenant: true },
  })

  if (!user) {
    console.log('❌ User NOT found!')
    console.log('📋 Creating user...\n')
    
    // Hash password
    const hashedPassword = await bcrypt.hash('Test@1234', 10)
    
    // Create or get tenant
    const tenant = await prisma.tenant.upsert({
      where: { subdomain: 'demo' },
      update: {},
      create: {
        name: 'Demo Business Pvt Ltd',
        subdomain: 'demo',
        plan: 'professional',
        status: 'active',
      },
    })
    
    // Create or update user
    const newUser = await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {
        password: hashedPassword,
      },
      create: {
        email: 'admin@demo.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'owner',
        tenantId: tenant.id,
      },
    })
    
    console.log('✅ User created/updated!')
    console.log('   Email:', newUser.email)
    console.log('   Name:', newUser.name)
    console.log('   Role:', newUser.role)
  } else {
    console.log('✅ User found!')
    console.log('   Email:', user.email)
    console.log('   Name:', user.name)
    console.log('   Role:', user.role)
    console.log('   Has Password:', !!user.password)
    console.log('   Tenant:', user.tenant?.name || 'None')
    
    // Test password
    if (user.password) {
      const isValid = await bcrypt.compare('Test@1234', user.password)
      console.log('   Password Test:', isValid ? '✅ Valid' : '❌ Invalid')
      
      if (!isValid) {
        console.log('\n⚠️  Password mismatch! Resetting password...')
        const hashedPassword = await bcrypt.hash('Test@1234', 10)
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        })
        console.log('✅ Password reset complete!')
      }
    } else {
      console.log('\n⚠️  No password set! Setting password...')
      const hashedPassword = await bcrypt.hash('Test@1234', 10)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      })
      console.log('✅ Password set!')
    }
  }
  
  console.log('\n✅ Login credentials ready!')
  console.log('   Email: admin@demo.com')
  console.log('   Password: Test@1234')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
