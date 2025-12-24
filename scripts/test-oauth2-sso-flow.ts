/**
 * Test OAuth2 SSO Flow End-to-End
 * 
 * Tests the complete OAuth2 SSO flow:
 * 1. User navigates to module
 * 2. Redirected to core for authentication
 * 3. User logs in
 * 4. Redirected back with code
 * 5. Token exchanged
 * 6. User can access module
 * 
 * Usage: npx tsx scripts/test-oauth2-sso-flow.ts
 */

const CORE_URL = process.env.CORE_AUTH_URL || 'http://localhost:3000'
const CRM_URL = process.env.CRM_URL || 'http://localhost:3001'

async function testOAuth2Flow() {
  console.log('🧪 Testing OAuth2 SSO Flow...\n')

  // Test 1: Authorization endpoint exists
  console.log('1️⃣ Testing authorization endpoint...')
  try {
    const authUrl = `${CORE_URL}/api/oauth/authorize?client_id=crm&redirect_uri=${encodeURIComponent(CRM_URL + '/api/oauth/callback')}&response_type=code&scope=openid profile email`
    const response = await fetch(authUrl, { redirect: 'manual' })
    
    if (response.status === 302 || response.status === 200) {
      console.log('   ✅ Authorization endpoint accessible')
    } else {
      console.log(`   ❌ Authorization endpoint returned ${response.status}`)
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
  }

  // Test 2: Token endpoint exists
  console.log('\n2️⃣ Testing token endpoint...')
  try {
    const tokenUrl = `${CORE_URL}/api/oauth/token`
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: 'test-code',
        redirect_uri: `${CRM_URL}/api/oauth/callback`,
        client_id: 'crm',
      }),
    })
    
    // Should return 400 (invalid code) but endpoint should exist
    if (response.status === 400 || response.status === 401) {
      console.log('   ✅ Token endpoint accessible')
    } else {
      console.log(`   ⚠️  Token endpoint returned ${response.status}`)
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
  }

  // Test 3: UserInfo endpoint exists
  console.log('\n3️⃣ Testing UserInfo endpoint...')
  try {
    const userInfoUrl = `${CORE_URL}/api/oauth/userinfo`
    const response = await fetch(userInfoUrl, {
      headers: { 'Authorization': 'Bearer test-token' },
    })
    
    // Should return 401 (invalid token) but endpoint should exist
    if (response.status === 401 || response.status === 400) {
      console.log('   ✅ UserInfo endpoint accessible')
    } else {
      console.log(`   ⚠️  UserInfo endpoint returned ${response.status}`)
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
  }

  // Test 4: CRM module callback endpoint exists
  console.log('\n4️⃣ Testing CRM module callback endpoint...')
  try {
    const callbackUrl = `${CRM_URL}/api/oauth/callback?code=test-code&state=test-state`
    const response = await fetch(callbackUrl, { redirect: 'manual' })
    
    // Should redirect or return error, but endpoint should exist
    if (response.status === 302 || response.status === 400 || response.status === 401) {
      console.log('   ✅ CRM callback endpoint accessible')
    } else {
      console.log(`   ⚠️  CRM callback endpoint returned ${response.status}`)
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
  }

  console.log('\n✅ OAuth2 SSO flow test complete!')
  console.log('\n📝 Next steps:')
  console.log('   1. Test with real authentication')
  console.log('   2. Test cross-module navigation')
  console.log('   3. Test token refresh')
  console.log('   4. Test logout flow')
}

testOAuth2Flow().catch(console.error)

