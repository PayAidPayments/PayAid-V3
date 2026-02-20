/**
 * Standalone script to add/update LeadSource records for existing contacts
 * This script does NOT delete any existing data - it only creates/updates LeadSource records
 * and links contacts to them.
 * 
 * Usage: npx tsx prisma/seeds/demo/add-lead-sources.ts [tenantId]
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addLeadSources(tenantId?: string) {
  try {
    console.log('📊 Adding Lead Sources to existing data...')
    console.log('')
    
    // If no tenantId provided, find ALL Demo Business tenants and process them all
    let targetTenantIds: string[] = []
    if (tenantId) {
      targetTenantIds = [tenantId]
      console.log(`✅ Using provided tenantId: ${tenantId}`)
    } else {
      console.log('🔍 Finding ALL Demo Business tenants...')
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
        console.error('❌ No Demo Business tenants found. Please provide tenantId as argument.')
        process.exit(1)
      }
      
      targetTenantIds = demoTenants.map(t => t.id)
      console.log(`✅ Found ${demoTenants.length} demo tenant(s):`)
      demoTenants.forEach(t => console.log(`   - ${t.name} (${t.id})`))
      console.log('')
    }
    
    // Process each tenant
    for (const targetTenantId of targetTenantIds) {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`Processing tenant: ${targetTenantId}`)
      console.log('='.repeat(60))
      console.log('')
    
    // Fetch all contacts for this tenant
    console.log('📇 Fetching contacts...')
    const allContacts = await prisma.contact.findMany({
      where: { tenantId: targetTenantId },
      select: { id: true, source: true, stage: true },
    })
    console.log(`  ✓ Found ${allContacts.length} contacts`)
    
    // Fetch all deals for this tenant
    console.log('💼 Fetching deals...')
    const allDeals = await prisma.deal.findMany({
      where: { tenantId: targetTenantId },
      select: { id: true, value: true, stage: true, contactId: true },
    })
    console.log(`  ✓ Found ${allDeals.length} deals`)
    console.log('')
    
    // Get unique source types from contacts
    const uniqueSources = Array.from(new Set(
      allContacts
        .map(c => c.source)
        .filter((s): s is string => s !== null && s !== undefined)
    ))
    
    console.log(`📋 Found ${uniqueSources.length} unique source types: ${uniqueSources.join(', ')}`)
    console.log('')
    
    // Define source types mapping
    const sourceTypeMap: Record<string, string> = {
      'Website': 'online',
      'LinkedIn': 'social',
      'Facebook': 'social',
      'Google Ads': 'paid',
      'Referral': 'referral',
      'Event': 'event',
      'Email': 'email',
      'Cold Call': 'outbound',
      'Partner': 'partner',
      'Trade Show': 'event',
      'Webinar': 'online',
      'Content Marketing': 'content',
      'Email Campaign': 'email',
      'Partner Referral': 'partner',
      'YouTube': 'social',
      'Twitter/X': 'social',
      'Instagram': 'social',
      'Bing Ads': 'paid',
    }
    
    const leadSources = []
    
    // Process each unique source
    for (const sourceName of uniqueSources) {
      if (!sourceName) continue
      
      console.log(`  📊 Processing source: ${sourceName}`)
      
      // Count leads (all contacts with this source)
      const leadsCount = allContacts.filter(c => c.source === sourceName).length
      
      // Count conversions (contacts with stage='customer' and this source)
      const conversionsCount = allContacts.filter(
        c => c.source === sourceName && c.stage === 'customer'
      ).length
      
      // Get contact IDs with this source
      const contactIdsWithSource = allContacts
        .filter(c => c.source === sourceName)
        .map(c => c.id)
      
      // Calculate total value from deals linked to contacts with this source
      const dealsForSource = allDeals.filter(
        d => contactIdsWithSource.includes(d.contactId) && d.stage === 'won'
      )
      const totalValue = dealsForSource.reduce((sum, d) => sum + (d.value || 0), 0)
      const avgDealValue = dealsForSource.length > 0 ? totalValue / dealsForSource.length : 0
      
      // Calculate conversion rate
      const conversionRate = leadsCount > 0 ? (conversionsCount / leadsCount) * 100 : 0
      
      // Determine source type
      const type = sourceTypeMap[sourceName] || 'other'
      
      try {
        // Check if lead source already exists
        let leadSource = await prisma.leadSource.findFirst({
          where: {
            tenantId: targetTenantId,
            name: sourceName,
          },
        })
        
        if (leadSource) {
          // Update existing lead source
          console.log(`    ↻ Updating existing LeadSource: ${sourceName}`)
          leadSource = await prisma.leadSource.update({
            where: { id: leadSource.id },
            data: {
              leadsCount,
              conversionsCount,
              totalValue,
              avgDealValue,
              conversionRate,
              type,
            },
          })
        } else {
          // Create new lead source
          console.log(`    ➕ Creating new LeadSource: ${sourceName}`)
          leadSource = await prisma.leadSource.create({
            data: {
              tenantId: targetTenantId,
              name: sourceName,
              type,
              leadsCount,
              conversionsCount,
              totalValue,
              avgDealValue,
              conversionRate,
              roi: 0,
            },
          })
        }
        
        leadSources.push(leadSource)
        
        // Link contacts with this source to the LeadSource record
        const updateResult = await prisma.contact.updateMany({
          where: {
            tenantId: targetTenantId,
            source: sourceName,
            sourceId: null, // Only update contacts that don't already have a sourceId
          },
          data: {
            sourceId: leadSource.id,
          },
        })
        
        console.log(`    ✓ Linked ${updateResult.count} contacts to LeadSource`)
        console.log(`    ✓ Stats: ${leadsCount} leads, ${conversionsCount} conversions, ₹${totalValue.toLocaleString('en-IN')} revenue`)
        console.log('')
      } catch (error: any) {
        console.error(`    ❌ Failed to create/update lead source ${sourceName}:`, error?.message || error)
        console.log('')
      }
    }
    
    // Also create additional lead sources that might not have contacts yet (for variety)
    console.log('📋 Creating additional lead sources for variety...')
    const additionalSources = [
      { name: 'Email Campaign', type: 'email' },
      { name: 'Cold Call', type: 'outbound' },
      { name: 'Partner Referral', type: 'partner' },
      { name: 'Trade Show', type: 'event' },
      { name: 'Webinar', type: 'online' },
      { name: 'Content Marketing', type: 'content' },
      { name: 'YouTube', type: 'social' },
      { name: 'Twitter/X', type: 'social' },
      { name: 'Instagram', type: 'social' },
      { name: 'Bing Ads', type: 'paid' },
    ]
    
    for (const source of additionalSources) {
      // Only create if it doesn't exist
      const exists = await prisma.leadSource.findFirst({
        where: {
          tenantId: targetTenantId,
          name: source.name,
        },
      })
      
      if (!exists) {
        try {
          const newSource = await prisma.leadSource.create({
            data: {
              tenantId: targetTenantId,
              name: source.name,
              type: source.type,
              leadsCount: 0,
              conversionsCount: 0,
              totalValue: 0,
              avgDealValue: 0,
              conversionRate: 0,
              roi: 0,
            },
          })
          leadSources.push(newSource)
          console.log(`  ➕ Created additional LeadSource: ${source.name}`)
        } catch (error: any) {
          // Silently continue - source might already exist
        }
      }
    }
    
      console.log('')
      console.log(`✅ Successfully created/updated ${leadSources.length} lead sources for tenant ${targetTenantId}`)
      console.log('')
      
      // Display summary for this tenant
      const topSources = await prisma.leadSource.findMany({
        where: { tenantId: targetTenantId },
        orderBy: { leadsCount: 'desc' },
        take: 10,
      })
      
      console.log(`📊 TOP 10 Lead Sources for tenant ${targetTenantId}:`)
      console.log('')
      if (topSources.length > 0) {
        topSources.forEach((source, idx) => {
          console.log(`  ${idx + 1}. ${source.name}`)
          console.log(`     Type: ${source.type}`)
          console.log(`     Leads: ${source.leadsCount}`)
          console.log(`     Conversions: ${source.conversionsCount}`)
          console.log(`     Revenue: ₹${source.totalValue.toLocaleString('en-IN')}`)
          console.log(`     Conversion Rate: ${source.conversionRate.toFixed(2)}%`)
          console.log('')
        })
      } else {
        console.log('  ⚠️  No lead sources found for this tenant')
        console.log('')
      }
    }
    
    console.log('\n✅ Completed processing all tenants!')
    
  } catch (error: any) {
    console.error('❌ Error adding lead sources:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
const tenantId = process.argv[2]
addLeadSources(tenantId)
  .then(() => {
    console.log('✅ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
