/**
 * Quick test script for Voice Agent API
 * Run with: npx tsx scripts/test-voice-agent-api.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testVoiceAgentAPI() {
  console.log('🧪 Testing Voice Agent API Setup...\n')

  try {
    // Test 1: Check if Prisma client has VoiceAgent model
    console.log('1️⃣  Checking Prisma Client...')
    if (typeof (prisma as any).voiceAgent === 'undefined') {
      console.error('❌ VoiceAgent model not found in Prisma client!')
      console.error('   Run: npx prisma generate')
      process.exit(1)
    }
    console.log('✅ VoiceAgent model found in Prisma client\n')

    // Test 2: Check database connection
    console.log('2️⃣  Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful\n')

    // Test 3: Check if we can query (without creating)
    console.log('3️⃣  Testing database query...')
    const count = await prisma.voiceAgent.count()
    console.log(`✅ Database query successful (found ${count} agents)\n`)

    // Test 4: Check schema fields
    console.log('4️⃣  Verifying schema...')
    // This will fail if schema is wrong
    try {
      await prisma.voiceAgent.findFirst({
        select: {
          id: true,
          name: true,
          language: true,
          systemPrompt: true,
          tenantId: true,
        },
      })
      console.log('✅ Schema fields are correct\n')
    } catch (error) {
      console.error('❌ Schema error:', error)
      process.exit(1)
    }

    console.log('✅ All tests passed!')
    console.log('\n📋 Next Steps:')
    console.log('   1. Make sure dev server is running')
    console.log('   2. Go to: http://localhost:3000/voice-agents/[tenant-id]/New')
    console.log('   3. Try creating an agent')
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    if (error instanceof Error) {
      console.error('   Error message:', error.message)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testVoiceAgentAPI()

