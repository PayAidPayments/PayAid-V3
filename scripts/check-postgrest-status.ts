/**
 * Check PostgREST Status in Supabase
 * 
 * This script helps determine if PostgREST is enabled and accessible
 */

interface PostgRESTStatus {
  enabled: boolean
  accessible: boolean
  error?: string
  statusCode?: number
  projectRef?: string
}

async function checkPostgRESTStatus(): Promise<PostgRESTStatus> {
  console.log('🔍 Checking PostgREST Status...\n')

  // Try to extract project reference from DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL not found in environment variables')
    console.log('   Please set DATABASE_URL or SUPABASE_URL to check PostgREST status\n')
    return {
      enabled: false,
      accessible: false,
      error: 'DATABASE_URL not configured',
    }
  }

  // Extract project reference from connection string
  let projectRef: string | undefined
  try {
    const url = new URL(databaseUrl)
    // Extract from hostname like: postgres.PROJECT_REF@pooler.supabase.com
    // or: db.PROJECT_REF.supabase.co
    const hostname = url.hostname
    if (hostname.includes('pooler.supabase.com')) {
      // Format: postgres.PROJECT_REF@pooler.supabase.com
      const match = url.username.match(/^postgres\.(.+)$/)
      if (match) {
        projectRef = match[1]
      }
    } else if (hostname.includes('.supabase.co')) {
      // Format: db.PROJECT_REF.supabase.co
      const match = hostname.match(/^db\.(.+)\.supabase\.co$/)
      if (match) {
        projectRef = match[1]
      }
    }
  } catch (error) {
    console.log('⚠️  Could not parse DATABASE_URL to extract project reference')
  }

  if (!projectRef) {
    console.log('⚠️  Could not determine project reference from DATABASE_URL')
    console.log('   Please provide SUPABASE_PROJECT_REF or SUPABASE_ANON_KEY\n')
    
    // Try to get from environment variables
    projectRef = process.env.SUPABASE_PROJECT_REF || process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/(.+)\.supabase\.co/)?.[1]
  }

  if (!projectRef) {
    return {
      enabled: false,
      accessible: false,
      error: 'Could not determine project reference',
    }
  }

  console.log(`📋 Project Reference: ${projectRef}\n`)

  // Try to get anon key from environment
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!anonKey) {
    console.log('⚠️  SUPABASE_ANON_KEY not found')
    console.log('   PostgREST is likely enabled (default), but cannot test without API key')
    console.log('   To test, add SUPABASE_ANON_KEY to your environment variables\n')
    return {
      enabled: true, // Assume enabled (default)
      accessible: false,
      error: 'API key not provided for testing',
      projectRef,
    }
  }

  // Test PostgREST endpoint
  const apiUrl = `https://${projectRef}.supabase.co/rest/v1/`
  console.log(`🔗 Testing: ${apiUrl}\n`)

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
    })

    const statusCode = response.status
    const enabled = statusCode !== 404
    const accessible = statusCode < 500

    if (enabled && accessible) {
      console.log('✅ PostgREST is ENABLED and ACCESSIBLE')
      console.log(`   Status Code: ${statusCode}`)
      console.log(`   API URL: ${apiUrl}`)
    } else if (enabled && !accessible) {
      console.log('⚠️  PostgREST is ENABLED but NOT ACCESSIBLE')
      console.log(`   Status Code: ${statusCode}`)
      console.log('   Possible reasons:')
      console.log('   - Invalid API key')
      console.log('   - RLS policies blocking access')
      console.log('   - Project paused')
    } else {
      console.log('❌ PostgREST appears to be DISABLED or NOT FOUND')
      console.log(`   Status Code: ${statusCode}`)
    }

    console.log('')

    return {
      enabled,
      accessible,
      statusCode,
      projectRef,
    }
  } catch (error: any) {
    console.log('❌ Error testing PostgREST:')
    console.log(`   ${error.message}\n`)
    return {
      enabled: true, // Assume enabled (default)
      accessible: false,
      error: error.message,
      projectRef,
    }
  }
}

// Main execution
checkPostgRESTStatus()
  .then((status) => {
    console.log('📊 Summary:')
    console.log(`   Enabled: ${status.enabled ? '✅ Yes' : '❌ No'}`)
    console.log(`   Accessible: ${status.accessible ? '✅ Yes' : '❌ No'}`)
    if (status.statusCode) {
      console.log(`   Status Code: ${status.statusCode}`)
    }
    if (status.error) {
      console.log(`   Error: ${status.error}`)
    }
    console.log('')

    if (!status.enabled) {
      console.log('💡 Recommendation:')
      console.log('   PostgREST appears to be disabled.')
      console.log('   RLS warnings will not apply.')
      console.log('   However, enabling RLS is still recommended for security.\n')
    } else if (!status.accessible) {
      console.log('💡 Recommendation:')
      console.log('   PostgREST is enabled but not accessible.')
      console.log('   This could be due to:')
      console.log('   - Missing or invalid API key')
      console.log('   - RLS policies blocking access')
      console.log('   - Project paused')
      console.log('   Enable RLS for security (see RLS_QUICK_FIX.md)\n')
    } else {
      console.log('💡 Recommendation:')
      console.log('   PostgREST is enabled and accessible.')
      console.log('   Enable RLS for security (see RLS_QUICK_FIX.md)\n')
    }

    process.exit(status.enabled && status.accessible ? 0 : 1)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })

