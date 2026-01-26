/**
 * Setup demo environment script
 * Creates a demo tenant with sample data for sales demos
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupDemoEnvironment() {
  console.log('🚀 Setting up demo environment...\n')

  try {
    // Check if demo tenant already exists
    let demoTenant = await prisma.tenant.findUnique({
      where: { subdomain: 'demo' },
    })

    if (demoTenant) {
      console.log(`✅ Demo tenant already exists: ${demoTenant.id}`)
      console.log(`   Skipping tenant creation, updating sample data...`)
    } else {
      // Create demo tenant
      demoTenant = await prisma.tenant.create({
        data: {
          name: 'Demo Company',
          subdomain: 'demo',
          plan: 'premium',
          status: 'active',
          onboardingCompleted: true,
        },
      })

      console.log(`✅ Created demo tenant: ${demoTenant.id}`)
    }

    // Check if demo user already exists
    let demoUser = await prisma.user.findUnique({
      where: { email: 'demo@payaid.com' },
    })

    if (demoUser) {
      console.log(`✅ Demo user already exists: ${demoUser.id}`)
    } else {
      // Create demo user
      demoUser = await prisma.user.create({
        data: {
          email: 'demo@payaid.com',
          name: 'Demo User',
          role: 'owner',
          tenantId: demoTenant.id,
          emailVerified: new Date(),
        },
      })

      console.log(`✅ Created demo user: ${demoUser.email}`)
    }

    // Create sample contacts
    const contacts = await Promise.all([
      prisma.contact.create({
        data: {
          tenantId: demoTenant.id,
          name: 'Acme Corporation',
          email: 'contact@acme.com',
          phone: '+91 9876543210',
          company: 'Acme Corporation',
          status: 'lead',
          leadScore: 85,
        },
      }),
      prisma.contact.create({
        data: {
          tenantId: demoTenant.id,
          name: 'TechStart Inc',
          email: 'hello@techstart.com',
          phone: '+91 9876543211',
          company: 'TechStart Inc',
          status: 'customer',
          leadScore: 92,
        },
      }),
      prisma.contact.create({
        data: {
          tenantId: demoTenant.id,
          name: 'Global Solutions',
          email: 'info@globalsolutions.com',
          phone: '+91 9876543212',
          company: 'Global Solutions',
          status: 'lead',
          leadScore: 65,
        },
      }),
    ])

    console.log(`✅ Created ${contacts.length} sample contacts`)

    // Create sample deals
    const deals = await Promise.all([
      prisma.deal.create({
        data: {
          tenantId: demoTenant.id,
          name: 'Acme Corporation - Enterprise Plan',
          value: 500000,
          stage: 'proposal',
          contactId: contacts[0].id,
          expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.deal.create({
        data: {
          tenantId: demoTenant.id,
          name: 'TechStart Inc - Premium Plan',
          value: 250000,
          stage: 'negotiation',
          contactId: contacts[1].id,
          expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.deal.create({
        data: {
          tenantId: demoTenant.id,
          name: 'Global Solutions - Basic Plan',
          value: 100000,
          stage: 'demo',
          contactId: contacts[2].id,
          expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        },
      }),
    ])

    console.log(`✅ Created ${deals.length} sample deals`)

    // Create sample tasks
    await Promise.all([
      prisma.task.create({
        data: {
          tenantId: demoTenant.id,
          title: 'Follow up with Acme Corporation',
          description: 'Send proposal and schedule demo',
          status: 'pending',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          contactId: contacts[0].id,
        },
      }),
      prisma.task.create({
        data: {
          tenantId: demoTenant.id,
          title: 'Review contract with TechStart',
          description: 'Finalize pricing and terms',
          status: 'pending',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          contactId: contacts[1].id,
        },
      }),
    ])

    console.log(`✅ Created sample tasks`)

    console.log('\n🎉 Demo environment setup complete!')
    console.log('\n📋 Demo Credentials:')
    console.log(`   Email: ${demoUser.email}`)
    console.log(`   Tenant ID: ${demoTenant.id}`)
    console.log(`   Subdomain: ${demoTenant.subdomain}`)
    console.log('\n💡 You can now use this tenant for sales demos!')
  } catch (error) {
    console.error('Error setting up demo environment:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupDemoEnvironment()
