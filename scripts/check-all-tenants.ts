import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAllTenants() {
  try {
    console.log('🔍 Finding ALL tenants...')
    
    const allTenants = await prisma.tenant.findMany({
      select: { id: true, name: true, subdomain: true },
      orderBy: { createdAt: 'desc' },
    })
    
    console.log(`✅ Found ${allTenants.length} total tenant(s):`)
    console.log('')
    
    allTenants.forEach((t, i) => {
      console.log(`${i + 1}. ${t.name}`)
      console.log(`   ID: ${t.id}`)
      console.log(`   Subdomain: ${t.subdomain || 'N/A'}`)
      
      // Check lead sources for this tenant
      prisma.leadSource.count({ where: { tenantId: t.id } })
        .then(count => {
          console.log(`   Lead Sources: ${count}`)
        })
        .catch(() => {
          console.log(`   Lead Sources: Error checking`)
        })
      console.log('')
    })
    
    // Specifically check the two tenant IDs we know about
    console.log('\n📊 Checking specific tenant IDs:')
    console.log('')
    
    const tenant1 = 'cmjimytmb0000snopu3p8h3b9'
    const tenant2 = 'cmjptk2mw0000aocw31u48n64'
    
    const t1 = await prisma.tenant.findUnique({ where: { id: tenant1 } })
    const t2 = await prisma.tenant.findUnique({ where: { id: tenant2 } })
    
    if (t1) {
      const sources1 = await prisma.leadSource.count({ where: { tenantId: tenant1 } })
      console.log(`✅ Tenant 1: ${t1.name} (${tenant1})`)
      console.log(`   Lead Sources: ${sources1}`)
    } else {
      console.log(`❌ Tenant 1: NOT FOUND (${tenant1})`)
    }
    
    console.log('')
    
    if (t2) {
      const sources2 = await prisma.leadSource.count({ where: { tenantId: tenant2 } })
      console.log(`✅ Tenant 2: ${t2.name} (${tenant2})`)
      console.log(`   Lead Sources: ${sources2}`)
      
      if (sources2 === 0 && t1) {
        console.log('\n⚠️  Tenant 2 has NO lead sources!')
        console.log('   Copying lead sources from Tenant 1...')
        
        const sourceSources = await prisma.leadSource.findMany({
          where: { tenantId: tenant1 },
        })
        
        console.log(`   Found ${sourceSources.length} sources to copy`)
        
        for (const source of sourceSources) {
          await prisma.leadSource.create({
            data: {
              tenantId: tenant2,
              name: source.name,
              type: source.type,
              leadsCount: source.leadsCount,
              conversionsCount: source.conversionsCount,
              totalValue: source.totalValue,
              avgDealValue: source.avgDealValue,
              conversionRate: source.conversionRate,
            },
          })
        }
        
        const finalCount = await prisma.leadSource.count({ where: { tenantId: tenant2 } })
        console.log(`   ✅ Created ${finalCount} lead sources for Tenant 2`)
      }
    } else {
      console.log(`❌ Tenant 2: NOT FOUND (${tenant2})`)
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkAllTenants()
