/**
 * Reset Admin Password Script
 * Resets the password for admin@demo.com to Test@1234
 * 
 * Run with: npx tsx scripts/reset-admin-password.ts
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetAdminPassword() {
  try {
    console.log('🔐 Resetting admin password...')
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash('Test@1234', 10)
    
    // Find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' },
    })
    
    if (!adminUser) {
      console.error('❌ Admin user not found!')
      console.log('Creating admin user...')
      
      // Find or create demo tenant
      const tenant = await prisma.tenant.upsert({
        where: { subdomain: 'demo' },
        update: {},
        create: {
          name: 'Demo Business Pvt Ltd',
          subdomain: 'demo',
          plan: 'professional',
          status: 'active',
          maxContacts: 1000,
          maxInvoices: 1000,
          maxUsers: 10,
          maxStorage: 10240,
          gstin: '29ABCDE1234F1Z5',
          address: '123 Business Park, MG Road',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
          phone: '+91-80-12345678',
          email: 'contact@demobusiness.com',
          website: 'https://demobusiness.com',
        },
      })
      
      // Create admin user
      await prisma.user.create({
        data: {
          email: 'admin@demo.com',
          name: 'Admin User',
          password: hashedPassword,
          role: 'owner',
          tenantId: tenant.id,
        },
      })
      
      console.log('✅ Admin user created successfully!')
    } else {
      // Update the password
      await prisma.user.update({
        where: { email: 'admin@demo.com' },
        data: {
          password: hashedPassword,
        },
      })
      
      console.log('✅ Admin password reset successfully!')
    }
    
    console.log('\n📋 Login Credentials:')
    console.log('  Email: admin@demo.com')
    console.log('  Password: Test@1234')
    console.log('\n✅ You can now login with these credentials!')
    
  } catch (error) {
    console.error('❌ Error resetting password:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()
