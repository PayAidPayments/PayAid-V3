/**
 * Test Voice Agent Implementation
 * Run with: npx tsx scripts/test-voice-agent.ts
 */

import { prisma } from '../lib/db/prisma'
import { VoiceAgentOrchestrator } from '../lib/voice-agent'

async function testVoiceAgent() {
  console.log('🧪 Testing Voice Agent Implementation\n')

  try {
    // Test 1: Check database connection
    console.log('1️⃣  Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected\n')

    // Test 2: Check if tables exist
    console.log('2️⃣  Checking database tables...')
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('VoiceAgent', 'VoiceAgentCall', 'VoiceAgentCallMetadata')
    `
    console.log(`✅ Found ${(tableCheck as any[]).length} voice agent tables\n`)

    // Test 3: Check Chroma connection
    console.log('3️⃣  Testing Chroma connection...')
    try {
      const response = await fetch('http://localhost:8001/api/v1/heartbeat')
      if (response.ok) {
        console.log('✅ Chroma is running\n')
      } else {
        console.log('⚠️  Chroma not responding (may still be starting)\n')
      }
    } catch (error) {
      console.log('⚠️  Chroma not accessible (may need to start: docker-compose up -d chroma)\n')
    }

    // Test 4: Check AI Gateway
    console.log('4️⃣  Testing AI Gateway...')
    try {
      const gatewayUrl = process.env.AI_GATEWAY_URL || 'http://localhost:8000'
      const response = await fetch(`${gatewayUrl}/health`)
      if (response.ok) {
        console.log('✅ AI Gateway is running\n')
      } else {
        console.log('⚠️  AI Gateway not responding\n')
      }
    } catch (error) {
      console.log('⚠️  AI Gateway not accessible (may need to start: docker-compose -f docker-compose.ai-services.yml up -d)\n')
    }

    // Test 5: Check Ollama
    console.log('5️⃣  Testing Ollama...')
    try {
      const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
      const response = await fetch(`${ollamaUrl}/api/tags`)
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Ollama is running (${data.models?.length || 0} models)\n`)
      } else {
        console.log('⚠️  Ollama not responding\n')
      }
    } catch (error) {
      console.log('⚠️  Ollama not accessible (may need to start: docker-compose -f docker-compose.ollama.yml up -d)\n')
    }

    // Test 6: Test orchestrator initialization
    console.log('6️⃣  Testing Voice Agent Orchestrator...')
    try {
      const orchestrator = new VoiceAgentOrchestrator()
      console.log('✅ Orchestrator initialized\n')
    } catch (error) {
      console.log('❌ Orchestrator initialization failed:', error)
    }

    console.log('✅ All tests completed!')
    console.log('\n📋 Next Steps:')
    console.log('   1. Run database migration: npx prisma db push')
    console.log('   2. Start services: docker-compose -f docker-compose.ai-services.yml up -d')
    console.log('   3. Create your first voice agent via API')
    console.log('   4. Test voice call processing')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testVoiceAgent()

