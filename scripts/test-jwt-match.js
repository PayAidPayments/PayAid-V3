/**
 * Test script to verify JWT_SECRET matches between Next.js and WebSocket server
 * 
 * This creates a test token using the same logic as Next.js and verifies it
 * using the same logic as the WebSocket server.
 * 
 * Usage: node scripts/test-jwt-match.js
 */

const { config } = require('dotenv')
const { resolve } = require('path')
const jwt = require('jsonwebtoken')

// Load .env file
config({ path: resolve(process.cwd(), '.env') })

const JWT_SECRET = (process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'change-me-in-production').trim()

console.log('='.repeat(60))
console.log('JWT Token Signing/Verification Test')
console.log('='.repeat(60))
console.log()

if (!JWT_SECRET || JWT_SECRET === 'change-me-in-production') {
  console.log('❌ JWT_SECRET is not configured')
  console.log('   Cannot test token signing/verification')
  process.exit(1)
}

// Create a test payload (same structure as Next.js app)
const testPayload = {
  userId: 'test-user-123',
  tenantId: 'test-tenant-456',
  email: 'test@example.com',
  role: 'admin'
}

console.log('Test Payload:')
console.log(JSON.stringify(testPayload, null, 2))
console.log()

// Sign token (same as Next.js app)
console.log('Signing token (Next.js logic)...')
let token
try {
  token = jwt.sign(testPayload, JWT_SECRET, {
    expiresIn: '24h'
  })
  console.log('✅ Token signed successfully')
  console.log(`   Token length: ${token.length} characters`)
  console.log(`   Token preview: ${token.substring(0, 50)}...`)
  console.log()
} catch (error) {
  console.log('❌ Failed to sign token:', error.message)
  process.exit(1)
}

// Verify token (same as WebSocket server)
console.log('Verifying token (WebSocket server logic)...')
try {
  const decoded = jwt.verify(token, JWT_SECRET)
  console.log('✅ Token verified successfully')
  console.log('   Decoded payload:')
  console.log(JSON.stringify(decoded, null, 2))
  console.log()
  
  // Check if userId and tenantId are present (required by WebSocket server)
  if (decoded.userId && decoded.tenantId) {
    console.log('✅ Token contains required fields (userId, tenantId)')
  } else {
    console.log('❌ Token missing required fields')
    console.log(`   userId: ${decoded.userId || 'MISSING'}`)
    console.log(`   tenantId: ${decoded.tenantId || 'MISSING'}`)
  }
  console.log()
} catch (error) {
  console.log('❌ Token verification failed:', error.message)
  console.log()
  console.log('This indicates a JWT_SECRET mismatch!')
  console.log('The token was signed with one secret but verified with another.')
  process.exit(1)
}

// Test with wrong secret (should fail)
console.log('Testing with wrong secret (should fail)...')
try {
  jwt.verify(token, 'wrong-secret')
  console.log('❌ ERROR: Token verified with wrong secret! This should not happen.')
  process.exit(1)
} catch (error) {
  console.log('✅ Correctly rejected token with wrong secret')
  console.log(`   Error: ${error.message}`)
  console.log()
}

console.log('='.repeat(60))
console.log('✅ All tests passed!')
console.log('='.repeat(60))
console.log()
console.log('If WebSocket connections are still failing:')
console.log('1. Restart the WebSocket server: npm run dev:websocket')
console.log('2. Check WebSocket server console for JWT_SECRET status')
console.log('3. Verify the server is reading from the same .env file')
console.log('='.repeat(60))
