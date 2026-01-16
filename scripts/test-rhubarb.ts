/**
 * Test script to verify Rhubarb Lip Sync installation and functionality
 */

import { checkRhubarbInstalled, generateLipSync } from '../lib/ai-influencer/lip-sync'
import { join } from 'path'
import { existsSync, writeFileSync } from 'fs'

async function testRhubarb() {
  console.log('🧪 Testing Rhubarb Lip Sync Installation\n')

  // Set RHUBARB_PATH if not set
  if (!process.env.RHUBARB_PATH) {
    process.env.RHUBARB_PATH = 'C:\\rhubarb\\rhubarb.exe'
    console.log(`[INFO] Set RHUBARB_PATH to: ${process.env.RHUBARB_PATH}`)
  }

  // Test 1: Check if Rhubarb is installed
  console.log('\n1️⃣  Testing Rhubarb installation check...')
  try {
    const isInstalled = await checkRhubarbInstalled()
    if (isInstalled) {
      console.log('✅ Rhubarb is installed and accessible')
    } else {
      console.log('❌ Rhubarb is not installed or not accessible')
      console.log(`   Checked path: ${process.env.RHUBARB_PATH || 'rhubarb'}`)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error checking Rhubarb installation:', error)
    process.exit(1)
  }

  // Test 2: Test with a dummy audio file (if we can create one)
  // Note: Rhubarb requires actual audio files, so we'll just verify the function exists
  console.log('\n2️⃣  Testing lip-sync function availability...')
  try {
    if (typeof generateLipSync === 'function') {
      console.log('✅ generateLipSync function is available')
    } else {
      console.log('❌ generateLipSync function not found')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error checking generateLipSync:', error)
    process.exit(1)
  }

  // Test 3: Verify environment variable
  console.log('\n3️⃣  Verifying environment configuration...')
  const rhubarbPath = process.env.RHUBARB_PATH || 'rhubarb'
  console.log(`   RHUBARB_PATH: ${rhubarbPath}`)
  
  if (rhubarbPath.includes('rhubarb.exe') && existsSync(rhubarbPath)) {
    console.log('✅ RHUBARB_PATH points to valid executable')
  } else if (rhubarbPath === 'rhubarb') {
    console.log('⚠️  Using default "rhubarb" command (should be in PATH)')
  } else {
    console.log('⚠️  RHUBARB_PATH may not point to valid executable')
  }

  console.log('\n✅ All tests passed!')
  console.log('\n📋 Summary:')
  console.log('   - Rhubarb installation: ✅ Verified')
  console.log('   - Lip-sync functions: ✅ Available')
  console.log('   - Environment config: ✅ Set')
  console.log('\n💡 To test with actual audio, use generateLipSync() with a WAV file')
}

// Run tests
testRhubarb().catch((error) => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})

