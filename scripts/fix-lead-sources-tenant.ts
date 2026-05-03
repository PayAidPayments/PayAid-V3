import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixLeadSourcesTenant() {
  try {
    console.log('🔍 Finding all demo tenants...')
    
    // Find all demo tenants
    const demoTenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { name: { contains: 'Demo Business', mode: 'insensitive' } },
          { subdomain: 'demo' },
        ],
      },
      select: { id: true, name: true },
    })
    
    if (demoTenants.length === 0) {
      console.error('❌ No demo tenants found')
      process.exit(1)
    }
    
    console.log(`✅ Found ${demoTenants.length} demo tenant(s):`)
    demoTenants.forEach(t => console.log(`   - ${t.name} (${t.id})`))
    console.log('')
    
    // Find the tenant that has lead sources (source tenant)
    const sourceTenant = demoTenants.find(t => {
      // We know from earlier that cmjimytmb0000snopu3p8h3b9 has lead sources
      return t.id === 'cmjimytmb0000snopu3p8h3b9'
    }) || demoTenants[0]
    
    console.log(`📊 Source tenant (has lead sources): ${sourceTenant.name} (${sourceTenant.id})`)
    console.log('')
    
    // Get all lead sources from source tenant
    const sourceLeadSources = await prisma.leadSource.findMany({
      where: { tenantId: sourceTenant.id },
    })
    
    console.log(`📋 Found ${sourceLeadSources.length} lead sources in source tenant`)
    console.log('')
    
    // For each target tenant (excluding source tenant), copy/update lead sources
    for (const targetTenant of demoTenants) {
      if (targetTenant.id === sourceTenant.id) {
        console.log(`⏭️  Skipping source tenant: ${targetTenant.name}`)
        continue
      }
      
      console.log(`\n${'='.repeat(60)}`)
      console.log(`Processing target tenant: ${targetTenant.name} (${targetTenant.id})`)
      console.log('='.repeat(60))
      
      // Check if target tenant already has lead sources
      const existingSources = await prisma.leadSource.findMany({
        where: { tenantId: targetTenant.id },
      })
      
      if (existingSources.length > 0) {
        console.log(`⚠️  Target tenant already has ${existingSources.length} lead sources`)
        console.log('   Updating existing sources with data from source tenant...')
        
        // Update existing sources with data from source tenant (match by name)
        for (const source of sourceLeadSources) {
          const existing = existingSources.find(s => s.name === source.name)
          if (existing) {
            await prisma.leadSource.update({
              where: { id: existing.id },
              data: {
                leadsCount: source.leadsCount,
                conversionsCount: source.conversionsCount,
                totalValue: source.totalValue,
                avgDealValue: source.avgDealValue,
                conversionRate: source.conversionRate,
                type: source.type,
              },
            })
            console.log(`   ✓ Updated: ${source.name}`)
          } else {
            // Create new source if it doesn't exist
            await prisma.leadSource.create({
              data: {
                tenantId: targetTenant.id,
                name: source.name,
                type: source.type,
                leadsCount: source.leadsCount,
                conversionsCount: source.conversionsCount,
                totalValue: source.totalValue,
                avgDealValue: source.avgDealValue,
                conversionRate: source.conversionRate,
              },
            })
            console.log(`   ➕ Created: ${source.name}`)
          }
        }
      } else {
        console.log(`   Creating ${sourceLeadSources.length} lead sources...`)
        
        // Create all lead sources for target tenant
        for (const source of sourceLeadSources) {
          await prisma.leadSource.create({
            data: {
              tenantId: targetTenant.id,
              name: source.name,
              type: source.type,
              leadsCount: source.leadsCount,
              conversionsCount: source.conversionsCount,
              totalValue: source.totalValue,
              avgDealValue: source.avgDealValue,
              conversionRate: source.conversionRate,
            },
          })
          console.log(`   ✓ Created: ${source.name}`)
        }
      }
      
      // Verify
      const finalSources = await prisma.leadSource.findMany({
        where: { tenantId: targetTenant.id },
        orderBy: { leadsCount: 'desc' },
        take: 5,
      })
      
      console.log(`\n✅ Target tenant now has ${finalSources.length} lead sources`)
      console.log('   Top 5 sources:')
      finalSources.slice(0, 5).forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.name}: ${s.leadsCount} leads`)
      })
    }
    
    console.log('\n✅ Script completed successfully!')
    
  } catch (error: any) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixLeadSourcesTenant()
