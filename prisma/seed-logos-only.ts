import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedLogosOnly() {
  console.log('🎨 Seeding Logos...\n')

  // Get the demo tenant
  const tenant = await prisma.tenant.findFirst({
    where: { subdomain: 'demo' },
  })

  if (!tenant) {
    console.error('❌ Demo tenant not found. Please run the main seed script first.')
    process.exit(1)
  }

  const tenantId = tenant.id
  console.log(`✅ Found tenant: ${tenant.name} (${tenantId})\n`)

  const logos = [
    {
      businessName: 'Demo Business',
      industry: 'Technology',
      style: 'modern',
      status: 'COMPLETED',
      prompt: 'Modern tech company logo with geometric shapes',
      colors: ['#2563eb', '#10b981'],
      modelUsed: 'stable-diffusion',
    },
    {
      businessName: 'Tech Solutions Inc',
      industry: 'Software',
      style: 'minimal',
      status: 'COMPLETED',
      prompt: 'Minimalist software company logo',
      colors: ['#000000', '#ffffff'],
      modelUsed: 'stable-diffusion',
    },
    {
      businessName: 'Creative Agency',
      industry: 'Marketing',
      style: 'playful',
      status: 'GENERATING',
      prompt: 'Playful and creative marketing agency logo',
      colors: ['#ff6b6b', '#4ecdc4', '#ffe66d'],
      modelUsed: null,
    },
    {
      businessName: 'Enterprise Corp',
      industry: 'Business',
      style: 'elegant',
      status: 'COMPLETED',
      prompt: 'Elegant corporate logo for enterprise business',
      colors: ['#1e40af', '#6366f1'],
      modelUsed: 'stable-diffusion',
    },
    {
      businessName: 'Startup Co',
      industry: 'Technology',
      style: 'modern',
      status: 'COMPLETED',
      prompt: 'Modern startup logo with bold colors',
      colors: ['#ef4444', '#f59e0b'],
      modelUsed: 'stable-diffusion',
    },
  ]

  // Delete existing logos and variations
  await prisma.logoVariation.deleteMany({ where: { logo: { tenantId } } })
  await prisma.logo.deleteMany({ where: { tenantId } })

  for (const logoData of logos) {
    const logo = await prisma.logo.create({
      data: {
        tenantId,
        businessName: logoData.businessName,
        industry: logoData.industry,
        style: logoData.style,
        status: logoData.status,
        prompt: logoData.prompt,
        colors: logoData.colors,
        modelUsed: logoData.modelUsed,
      },
    })

    // Create variations for completed logos
    if (logo.status === 'COMPLETED') {
      const variations = [
        { style: 'modern', color: '2563eb' },
        { style: 'minimal', color: '10b981' },
        { style: 'playful', color: 'f59e0b' },
      ]
      
      for (let idx = 0; idx < variations.length; idx++) {
        const variation = variations[idx]
        // Use shorter, simpler URLs that will definitely work
        const shortName = logo.businessName.replace(/\s+/g, '').substring(0, 10)
        const imageUrl = `https://placehold.co/800x600/${variation.color}/ffffff?text=${shortName}`
        const thumbnailUrl = `https://placehold.co/256x256/${variation.color}/ffffff?text=${shortName}`
        
        await prisma.logoVariation.create({
          data: {
            logoId: logo.id,
            iconStyle: variation.style,
            imageUrl,
            thumbnailUrl,
            tenantId,
            isSelected: idx === 0, // First variation is selected
          },
        })
      }
    }
  }

  console.log('✅ Logos seeded successfully!\n')
  console.log(`   - Created ${logos.length} logos`)
  console.log(`   - Created variations for completed logos`)
}

seedLogosOnly()
  .catch((e) => {
    console.error('❌ Error seeding logos:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
