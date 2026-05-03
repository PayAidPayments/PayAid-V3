/**
 * Check Vercel Environment Variables
 * 
 * This script helps verify Vercel environment variables are set correctly
 * Run this locally to check what should be set in Vercel
 */

async function checkVercelEnv() {
  console.log('🔍 Checking Environment Variables for Vercel...\n')

  const checks = [
    {
      name: 'DATABASE_URL',
      required: true,
      description: 'Supabase database connection string',
      format: 'postgresql://postgres.PROJECT_REF:PASSWORD@pooler.supabase.com:5432/postgres?schema=public',
      current: process.env.DATABASE_URL ? '✅ Set' : '❌ Not Set',
      recommendation: 'Use Supabase Session Pooler (port 5432) for Vercel',
    },
    {
      name: 'DATABASE_CONNECTION_LIMIT',
      required: false,
      description: 'Maximum connections in pool (optional, defaults to 10)',
      format: '10',
      current: process.env.DATABASE_CONNECTION_LIMIT || 'Using default (10)',
      recommendation: 'Set to 10 for serverless (Vercel)',
    },
  ]

  console.log('📋 Environment Variables Checklist:\n')

  checks.forEach((check) => {
    const required = check.required ? ' (REQUIRED)' : ' (OPTIONAL)'
    console.log(`${check.name}${required}`)
    console.log(`   Description: ${check.description}`)
    console.log(`   Current: ${check.current}`)
    console.log(`   Format: ${check.format}`)
    console.log(`   Recommendation: ${check.recommendation}`)
    console.log('')
  })

  console.log('📝 To update in Vercel:')
  console.log('1. Go to: https://vercel.com/dashboard')
  console.log('2. Select project: payaid-v3')
  console.log('3. Settings → Environment Variables')
  console.log('4. Add/Edit variables as needed')
  console.log('5. Redeploy after changes\n')

  console.log('🔗 Get Supabase Connection String:')
  console.log('1. Go to: https://supabase.com/dashboard')
  console.log('2. Select your project')
  console.log('3. Settings → Database → Connection Pooling')
  console.log('4. Copy Session mode connection string (port 5432)')
  console.log('5. Add ?schema=public at the end\n')
}

checkVercelEnv()

