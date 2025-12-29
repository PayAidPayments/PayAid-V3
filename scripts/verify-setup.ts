/**
 * Verify Setup Script
 * Checks if all new features are properly configured
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifySetup() {
  console.log('🔍 Verifying PayAid V3 New Features Setup...\n')

  const checks = {
    database: false,
    models: false,
    envVars: false,
  }

  // Check 1: Database connection
  try {
    await prisma.$connect()
    console.log('✅ Database connection: OK')
    checks.database = true
  } catch (error) {
    console.log('❌ Database connection: FAILED')
    console.error(error)
    return
  }

  // Check 2: Verify models exist
  try {
    // Try to query each new model
    await prisma.loyaltyProgram.findFirst()
    await prisma.supplier.findFirst()
    await prisma.productionSchedule.findFirst()
    await prisma.emailBounce.findFirst()
    await prisma.sMSTemplate.findFirst()
    await prisma.sMSDeliveryReport.findFirst()
    await prisma.sMSOptOut.findFirst()
    console.log('✅ Database models: OK (all models exist)')
    checks.models = true
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      console.log('❌ Database models: FAILED (models not found)')
      console.log('   Run: npx prisma migrate dev --name add_loyalty_supplier_email_sms_models')
    } else {
      console.log('⚠️  Database models: WARNING (some models may be missing)')
      console.error(error)
    }
  }

  // Check 3: Environment variables
  const required = ['DATABASE_URL']
  const optional = [
    'SENDGRID_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'EXOTEL_API_KEY',
    'GOOGLE_CLIENT_ID',
  ]

  const missingRequired: string[] = []
  const missingOptional: string[] = []

  required.forEach((varName) => {
    if (!process.env[varName]) {
      missingRequired.push(varName)
    }
  })

  optional.forEach((varName) => {
    if (!process.env[varName]) {
      missingOptional.push(varName)
    }
  })

  if (missingRequired.length === 0) {
    console.log('✅ Required environment variables: OK')
    checks.envVars = true
  } else {
    console.log('❌ Required environment variables: MISSING')
    missingRequired.forEach((v) => console.log(`   - ${v}`))
  }

  if (missingOptional.length > 0) {
    console.log('⚠️  Optional environment variables not set:')
    missingOptional.forEach((v) => console.log(`   - ${v}`))
    console.log('   (Features may not work without these)')
  }

  // Summary
  console.log('\n📊 Setup Summary:')
  console.log(`   Database: ${checks.database ? '✅' : '❌'}`)
  console.log(`   Models: ${checks.models ? '✅' : '❌'}`)
  console.log(`   Environment: ${checks.envVars ? '✅' : '❌'}`)

  if (checks.database && checks.models && checks.envVars) {
    console.log('\n🎉 All checks passed! Setup is complete.')
  } else {
    console.log('\n⚠️  Some checks failed. Please review the errors above.')
    console.log('   See SETUP_GUIDE.md for detailed setup instructions.')
  }

  await prisma.$disconnect()
}

verifySetup().catch(console.error)

