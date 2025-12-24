/**
 * Test PayAid Payments Connection
 * Verifies admin credentials are configured correctly
 */

/**
 * Test PayAid Payments Connection
 * Verifies admin credentials are configured correctly
 */

// Load environment variables from .env file
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env') })

import { getAdminPayAidConfig } from '../lib/payments/get-admin-payment-config'
import { createPayAidPayments } from '../lib/payments/payaid'

async function main() {
  console.log('🔍 Testing PayAid Payments Admin Credentials...\n')

  try {
    // Get admin config
    const config = getAdminPayAidConfig()

    console.log('✅ Admin Credentials Loaded:')
    console.log(`   API Key: ${config.apiKey.substring(0, 8)}...${config.apiKey.substring(config.apiKey.length - 4)}`)
    console.log(`   SALT: ${config.salt.substring(0, 8)}...${config.salt.substring(config.salt.length - 4)}`)
    console.log(`   Base URL: ${config.baseUrl}`)

    // Create PayAid instance
    const payaid = createPayAidPayments(config)

    console.log('\n✅ PayAid Payments instance created successfully!')
    console.log('\n💡 Credentials are configured correctly.')
    console.log('   You can now use PayAid Payments for:')
    console.log('   - App Store module purchases')
    console.log('   - Subscription payments')
    console.log('   - Platform-level transactions')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.log('\n💡 Make sure you have set in .env file:')
    console.log('   PAYAID_ADMIN_API_KEY="9306f7fd-57c4-409d-807d-2c23cb4a0212"')
    console.log('   PAYAID_ADMIN_SALT="a64c89fea6c404275bcf5bd59d592c4878ae4d45"')
    console.log('   PAYAID_PAYMENTS_BASE_URL="https://api.payaidpayments.com"')
  }
}

main()
  .catch(console.error)

