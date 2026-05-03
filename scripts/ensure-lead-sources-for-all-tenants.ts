import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function ensureLeadSourcesForAllTenants() {
  try {
    console.log('🔍 Ensuring lead sources exist for all tenants...')
    console.log('')
    
    // Find the demo tenant that has lead sources (template)
    const demoTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { name: { contains: 'Demo Business', mode: 'insensitive' } },
          { subdomain: 'demo' },
        ],
      },
    })
    
    if (!demoTenant) {
      console.error('❌ Demo tenant not found')
      process.exit(1)
    }
    
    console.log(`✅ Found demo tenant: ${demoTenant.name} (${demoTenant.id})`)
    
    // Get template lead sources from demo tenant
    const templateSources = await prisma.leadSource.findMany({
      where: { tenantId: demoTenant.id },
      orderBy: { leadsCount: 'desc' },
    })
    
    console.log(`📋 Found ${templateSources.length} template lead sources`)
    console.log('')
    
    if (templateSources.length === 0) {
      console.error('❌ No template lead sources found in demo tenant')
      process.exit(1)
    }
    
    // Get ALL tenants
    const allTenants = await prisma.tenant.findMany({
      select: { id: true, name: true },
    })
    
    console.log(`📊 Processing ${allTenants.length} tenant(s)...`)
    console.log('')
    
    // For each tenant, ensure they have lead sources
    for (const tenant of allTenants) {
      const existingCount = await prisma.leadSource.count({
        where: { tenantId: tenant.id },
      })
      
      if (existingCount > 0) {
        console.log(`⏭️  Tenant "${tenant.name}" (${tenant.id}) already has ${existingCount} lead sources`)
        continue
      }
      
      console.log(`\n${'='.repeat(60)}`)
      console.log(`Creating lead sources for: ${tenant.name} (${tenant.id})`)
      console.log('='.repeat(60))
      
      // Create lead sources from template
      let created = 0
      for (const template of templateSources) {
        try {
          await prisma.leadSource.create({
            data: {
              tenantId: tenant.id,
              name: template.name,
              type: template.type,
              leadsCount: template.leadsCount,
              conversionsCount: template.conversionsCount,
              totalValue: template.totalValue,
              avgDealValue: template.avgDealValue,
              conversionRate: template.conversionRate,
            },
          })
          created++
          console.log(`   ✓ Created: ${template.name} (${template.leadsCount} leads)`)
        } catch (error: any) {
          // If source already exists (race condition), skip
          if (error?.code === 'P2002') {
            console.log(`   ⏭️  Skipped (already exists): ${template.name}`)
          } else {
            console.error(`   ❌ Failed: ${template.name} - ${error?.message}`)
          }
        }
      }
      
      const finalCount = await prisma.leadSource.count({
        where: { tenantId: tenant.id },
      })
      
      console.log(`\n✅ Created ${created} lead sources (total: ${finalCount})`)
    }
    
    // Also handle the specific tenant ID from the dashboard
    const dashboardTenantId = 'cmjptk2mw0000aocw31u48n64'
    const dashboardTenant = await prisma.tenant.findUnique({
      where: { id: dashboardTenantId },
    })
    
    if (!dashboardTenant) {
      console.log(`\n⚠️  Dashboard tenant ID "${dashboardTenantId}" not found in database`)
      console.log('   This might be a stale session. Lead sources will be created when the tenant is accessed.')
    } else {
      const dashboardSources = await prisma.leadSource.count({
        where: { tenantId: dashboardTenantId },
      })
      
      if (dashboardSources === 0) {
        console.log(`\n📊 Creating lead sources for dashboard tenant: ${dashboardTenant.name}`)
        
        for (const template of templateSources) {
          await prisma.leadSource.create({
            data: {
              tenantId: dashboardTenantId,
              name: template.name,
              type: template.type,
              leadsCount: template.leadsCount,
              conversionsCount: template.conversionsCount,
              totalValue: template.totalValue,
              avgDealValue: template.avgDealValue,
              conversionRate: template.conversionRate,
            },
          })
        }
        
        console.log(`✅ Created ${templateSources.length} lead sources for dashboard tenant`)
      }
    }
    
    console.log('\n✅ Script completed successfully!')
    
  } catch (error: any) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

ensureLeadSourcesForAllTenants()
