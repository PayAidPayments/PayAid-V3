/**
 * Add PayAid Payments Admin Credentials to .env file
 * 
 * SECURITY: This script adds admin credentials to .env file
 * Never commit .env file to git!
 */

import * as fs from 'fs'
import * as path from 'path'

const credentials = {
  PAYAID_ADMIN_API_KEY: '9306f7fd-57c4-409d-807d-2c23cb4a0212',
  PAYAID_ADMIN_SALT: 'a64c89fea6c404275bcf5bd59d592c4878ae4d45',
  PAYAID_PAYMENTS_BASE_URL: 'https://api.payaidpayments.com',
  PAYAID_PAYMENTS_PG_API_URL: 'https://api.payaidpayments.com',
}

async function main() {
  const envPath = path.join(process.cwd(), '.env')
  
  console.log('🔐 Adding PayAid Payments Admin Credentials to .env file...\n')

  try {
    // Read existing .env file
    let envContent = ''
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8')
      console.log('✅ Found existing .env file')
    } else {
      console.log('⚠️  .env file not found, creating new one')
    }

    // Check if credentials already exist
    const hasApiKey = envContent.includes('PAYAID_ADMIN_API_KEY=')
    const hasSalt = envContent.includes('PAYAID_ADMIN_SALT=')
    const hasBaseUrl = envContent.includes('PAYAID_PAYMENTS_BASE_URL=')
    const hasPgUrl = envContent.includes('PAYAID_PAYMENTS_PG_API_URL=')

    if (hasApiKey && hasSalt && hasBaseUrl && hasPgUrl) {
      console.log('⚠️  Admin credentials already exist in .env file')
      console.log('   Updating with new values...\n')
    }

    // Update or add credentials
    let updatedContent = envContent

    // Update PAYAID_ADMIN_API_KEY
    if (hasApiKey) {
      updatedContent = updatedContent.replace(
        /PAYAID_ADMIN_API_KEY=.*/g,
        `PAYAID_ADMIN_API_KEY="${credentials.PAYAID_ADMIN_API_KEY}"`
      )
      console.log('✅ Updated PAYAID_ADMIN_API_KEY')
    } else {
      // Add before PayAid Payments section or at end
      const payaidSection = updatedContent.match(/# PayAid Payments.*?(?=\n#|\n$|$)/s)
      if (payaidSection) {
        updatedContent = updatedContent.replace(
          /(# PayAid Payments.*?)(?=\n#|\n$|$)/s,
          `$1\nPAYAID_ADMIN_API_KEY="${credentials.PAYAID_ADMIN_API_KEY}"`
        )
      } else {
        updatedContent += `\n# Admin PayAid Payments Credentials (Platform Payments Only)\nPAYAID_ADMIN_API_KEY="${credentials.PAYAID_ADMIN_API_KEY}"\n`
      }
      console.log('✅ Added PAYAID_ADMIN_API_KEY')
    }

    // Update PAYAID_ADMIN_SALT
    if (hasSalt) {
      updatedContent = updatedContent.replace(
        /PAYAID_ADMIN_SALT=.*/g,
        `PAYAID_ADMIN_SALT="${credentials.PAYAID_ADMIN_SALT}"`
      )
      console.log('✅ Updated PAYAID_ADMIN_SALT')
    } else {
      updatedContent = updatedContent.replace(
        /PAYAID_ADMIN_API_KEY=".*"/,
        `PAYAID_ADMIN_API_KEY="${credentials.PAYAID_ADMIN_API_KEY}"\nPAYAID_ADMIN_SALT="${credentials.PAYAID_ADMIN_SALT}"`
      )
      console.log('✅ Added PAYAID_ADMIN_SALT')
    }

    // Update PAYAID_PAYMENTS_BASE_URL
    if (hasBaseUrl) {
      updatedContent = updatedContent.replace(
        /PAYAID_PAYMENTS_BASE_URL=.*/g,
        `PAYAID_PAYMENTS_BASE_URL="${credentials.PAYAID_PAYMENTS_BASE_URL}"`
      )
      console.log('✅ Updated PAYAID_PAYMENTS_BASE_URL')
    } else {
      updatedContent = updatedContent.replace(
        /PAYAID_ADMIN_SALT=".*"/,
        `PAYAID_ADMIN_SALT="${credentials.PAYAID_ADMIN_SALT}"\nPAYAID_PAYMENTS_BASE_URL="${credentials.PAYAID_PAYMENTS_BASE_URL}"`
      )
      console.log('✅ Added PAYAID_PAYMENTS_BASE_URL')
    }

    // Update PAYAID_PAYMENTS_PG_API_URL
    if (hasPgUrl) {
      updatedContent = updatedContent.replace(
        /PAYAID_PAYMENTS_PG_API_URL=.*/g,
        `PAYAID_PAYMENTS_PG_API_URL="${credentials.PAYAID_PAYMENTS_PG_API_URL}"`
      )
      console.log('✅ Updated PAYAID_PAYMENTS_PG_API_URL')
    } else {
      updatedContent = updatedContent.replace(
        /PAYAID_PAYMENTS_BASE_URL=".*"/,
        `PAYAID_PAYMENTS_BASE_URL="${credentials.PAYAID_PAYMENTS_BASE_URL}"\nPAYAID_PAYMENTS_PG_API_URL="${credentials.PAYAID_PAYMENTS_PG_API_URL}"`
      )
      console.log('✅ Added PAYAID_PAYMENTS_PG_API_URL')
    }

    // Write updated content
    fs.writeFileSync(envPath, updatedContent, 'utf-8')
    
    console.log('\n✅ Successfully added/updated admin credentials in .env file!')
    console.log('\n🔒 Security Reminder:')
    console.log('   - .env file is gitignored')
    console.log('   - Never commit .env file')
    console.log('   - Credentials are admin-only')
    console.log('\n💡 Next step: Test configuration')
    console.log('   npx tsx scripts/test-payaid-connection.ts')

  } catch (error: any) {
    console.error('❌ Error updating .env file:', error.message)
    console.log('\n💡 Manual setup:')
    console.log('   Add these lines to your .env file:')
    console.log(`   PAYAID_ADMIN_API_KEY="${credentials.PAYAID_ADMIN_API_KEY}"`)
    console.log(`   PAYAID_ADMIN_SALT="${credentials.PAYAID_ADMIN_SALT}"`)
    console.log(`   PAYAID_PAYMENTS_BASE_URL="${credentials.PAYAID_PAYMENTS_BASE_URL}"`)
    console.log(`   PAYAID_PAYMENTS_PG_API_URL="${credentials.PAYAID_PAYMENTS_PG_API_URL}"`)
    process.exit(1)
  }
}

main()
  .catch(console.error)

