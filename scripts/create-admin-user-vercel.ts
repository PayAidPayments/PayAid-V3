/**
 * Script to create admin user on Vercel
 * 
 * Usage:
 *   npx tsx scripts/create-admin-user-vercel.ts
 * 
 * Or set VERCEL_URL environment variable:
 *   VERCEL_URL=https://payaid-v3.vercel.app npx tsx scripts/create-admin-user-vercel.ts
 */

const VERCEL_URL = process.env.VERCEL_URL || 'https://payaid-v3.vercel.app'
const EMAIL = 'admin@demo.com'
const PASSWORD = 'Test@1234'

async function createAdminUser() {
  try {
    console.log(`🔐 Creating admin user on ${VERCEL_URL}...`)
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Password: ${PASSWORD}`)
    console.log('')

    const response = await fetch(`${VERCEL_URL}/api/admin/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Failed to create user:')
      console.error(JSON.stringify(data, null, 2))
      process.exit(1)
    }

    console.log('✅ Success!')
    console.log(JSON.stringify(data, null, 2))
    console.log('')
    console.log(`You can now login at: ${VERCEL_URL}/login`)
    console.log(`Email: ${EMAIL}`)
    console.log(`Password: ${PASSWORD}`)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

createAdminUser()




