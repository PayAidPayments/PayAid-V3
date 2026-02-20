import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkLeadSources() {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { name: { contains: 'Demo Business', mode: 'insensitive' } },
          { subdomain: 'demo' },
        ],
      },
    })
    
    if (!tenant) {
      console.log('❌ No demo tenant found')
      process.exit(1)
    }
    
    console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})`)
    console.log('')
    
    const sources = await prisma.leadSource.findMany({
      where: { tenantId: tenant.id },
      orderBy: { leadsCount: 'desc' },
      take: 15,
    })
    
    console.log(`📊 Found ${sources.length} lead sources:`)
    console.log('')
    
    if (sources.length === 0) {
      console.log('⚠️  No lead sources found!')
    } else {
      sources.forEach((s, i) => {
        console.log(`${i + 1}. ${s.name}`)
        console.log(`   Type: ${s.type}`)
        console.log(`   Leads: ${s.leadsCount}`)
        console.log(`   Conversions: ${s.conversionsCount}`)
        console.log(`   Revenue: ₹${s.totalValue.toLocaleString('en-IN')}`)
        console.log(`   Conversion Rate: ${s.conversionRate.toFixed(2)}%`)
        console.log('')
      })
    }
    
    // Also check contacts with sources
    const contactsWithSources = await prisma.contact.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, source: true, sourceId: true },
      take: 10,
    })
    
    console.log(`📇 Sample contacts (first 10):`)
    contactsWithSources.forEach((c, i) => {
      console.log(`${i + 1}. Source: ${c.source || 'null'}, sourceId: ${c.sourceId || 'null'}`)
    })
    
  } catch (error: any) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLeadSources()
