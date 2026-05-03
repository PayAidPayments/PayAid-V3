/**
 * Script to seed demo data via API endpoint
 * Usage: npx tsx scripts/seed-demo-data.ts [tenantId] [token]
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TENANT_ID = process.argv[2] || 'demo-business'
const TOKEN = process.argv[3] || process.env.ADMIN_TOKEN || ''

async function seedDemoData() {
  try {
    console.log(`🌱 Seeding demo data for tenant: ${TENANT_ID}`)
    console.log(`📡 API URL: ${BASE_URL}/api/admin/seed-demo-data?background=true`)
    
    if (!TOKEN) {
      console.error('❌ Error: No authentication token provided')
      console.log('Usage: npx tsx scripts/seed-demo-data.ts [tenantId] [token]')
      console.log('Or set ADMIN_TOKEN environment variable')
      process.exit(1)
    }

    const response = await fetch(`${BASE_URL}/api/admin/seed-demo-data?background=true`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Error: ${response.status} ${response.statusText}`)
      console.error(`Response: ${errorText}`)
      process.exit(1)
    }

    const data = await response.json()
    
    if (response.status === 202) {
      console.log('✅ Seeding started in background')
      console.log('📊 Response:', JSON.stringify(data, null, 2))
      console.log('\n💡 Note: Seeding runs in background. Check logs or wait a few moments.')
    } else {
      console.log('✅ Seeding completed')
      console.log('📊 Response:', JSON.stringify(data, null, 2))
      
      if (data.counts) {
        console.log('\n📈 Records created:')
        console.log(`  - Contacts: ${data.counts.contacts || 0}`)
        console.log(`  - Deals: ${data.counts.deals || 0}`)
        console.log(`  - Tasks: ${data.counts.tasks || 0}`)
        console.log(`  - Meetings: ${data.counts.meetings || 0}`)
        if (data.counts.totalCRMRecords) {
          console.log(`  - Total CRM Records: ${data.counts.totalCRMRecords}`)
        }
      }
    }
    
    console.log(`\n🎉 Demo data seeding ${response.status === 202 ? 'started' : 'completed'} successfully!`)
    
  } catch (error: any) {
    console.error('❌ Failed to seed demo data:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

seedDemoData()
