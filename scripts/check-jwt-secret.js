/**
 * Diagnostic script to check JWT_SECRET configuration
 * 
 * This script helps identify if JWT_SECRET is configured correctly
 * and matches between Next.js and WebSocket server expectations.
 * 
 * Usage: node scripts/check-jwt-secret.js
 */

const { config } = require('dotenv')
const { resolve } = require('path')
const crypto = require('crypto')

// Load .env file
config({ path: resolve(process.cwd(), '.env') })

const JWT_SECRET = (process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'change-me-in-production').trim()

console.log('='.repeat(60))
console.log('JWT_SECRET Configuration Check')
console.log('='.repeat(60))
console.log()

// Check if JWT_SECRET is set
if (!JWT_SECRET || JWT_SECRET === 'change-me-in-production') {
  console.log('❌ JWT_SECRET is NOT configured or using default value')
  console.log('   This will cause authentication failures!')
  console.log()
  console.log('To fix:')
  console.log('1. Add JWT_SECRET to your .env file:')
  console.log('   JWT_SECRET=your-secret-key-here')
  console.log()
  console.log('2. Generate a secure secret:')
  console.log('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')
  console.log()
} else {
  console.log('✅ JWT_SECRET is configured')
  console.log()
  
  // Show first and last few characters for verification (without exposing full secret)
  const preview = JWT_SECRET.length > 10 
    ? `${JWT_SECRET.substring(0, 4)}...${JWT_SECRET.substring(JWT_SECRET.length - 4)}`
    : '***'
  console.log(`   Length: ${JWT_SECRET.length} characters`)
  console.log(`   Preview: ${preview}`)
  console.log()
  
  // Create a hash fingerprint for comparison
  const hash = crypto.createHash('sha256').update(JWT_SECRET).digest('hex')
  console.log(`   SHA256 Hash (for comparison): ${hash.substring(0, 16)}...`)
  console.log()
}

// Check source
console.log('Source:')
if (process.env.JWT_SECRET) {
  console.log('   ✅ Using JWT_SECRET from environment')
} else if (process.env.NEXTAUTH_SECRET) {
  console.log('   ⚠️  Using NEXTAUTH_SECRET as fallback (JWT_SECRET not found)')
} else {
  console.log('   ❌ Using default value (not configured)')
}
console.log()

// Check .env file location
const envPath = resolve(process.cwd(), '.env')
const fs = require('fs')
if (fs.existsSync(envPath)) {
  console.log(`✅ .env file found at: ${envPath}`)
  
  // Check if JWT_SECRET is in .env file
  const envContent = fs.readFileSync(envPath, 'utf8')
  if (envContent.includes('JWT_SECRET=')) {
    console.log('   ✅ JWT_SECRET found in .env file')
  } else {
    console.log('   ⚠️  JWT_SECRET not found in .env file')
    console.log('   Add it to fix the issue')
  }
} else {
  console.log(`❌ .env file not found at: ${envPath}`)
  console.log('   Create a .env file and add JWT_SECRET')
}
console.log()

console.log('='.repeat(60))
console.log('Next Steps:')
console.log('='.repeat(60))
console.log('1. If JWT_SECRET is not configured, add it to .env file')
console.log('2. Restart both servers:')
console.log('   - Next.js: npm run dev')
console.log('   - WebSocket: npm run dev:websocket')
console.log('3. Check WebSocket server console for:')
console.log('   [WebSocket] JWT_SECRET configured: Yes (custom secret)')
console.log('='.repeat(60))
