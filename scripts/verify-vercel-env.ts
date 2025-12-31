/**
 * Verify Vercel Environment Variables
 * 
 * Checks if all required environment variables are set correctly in Vercel
 * 
 * Usage:
 *   npx tsx scripts/verify-vercel-env.ts
 */

import { execSync } from 'child_process'

interface EnvVar {
  name: string
  environments: string[]
  required: boolean
  description: string
}

const requiredVars: EnvVar[] = [
  {
    name: 'DATABASE_URL',
    environments: ['Production', 'Preview'],
    required: true,
    description: 'Production database connection string',
  },
  {
    name: 'CRON_SECRET',
    environments: ['Production', 'Preview'],
    required: true,
    description: 'Secret for cron job authentication',
  },
  {
    name: 'ENCRYPTION_KEY',
    environments: ['Production', 'Preview'],
    required: true,
    description: 'AES-256 encryption key (64 hex characters)',
  },
  {
    name: 'UPSTASH_REDIS_REST_URL',
    environments: ['Production', 'Preview'],
    required: true,
    description: 'Upstash Redis REST URL for rate limiting',
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    environments: ['Production', 'Preview'],
    required: true,
    description: 'Upstash Redis REST token',
  },
  {
    name: 'JWT_SECRET',
    environments: ['Production', 'Preview'],
    required: true,
    description: 'JWT signing secret',
  },
]

const optionalVars: EnvVar[] = [
  {
    name: 'SENTRY_DSN',
    environments: ['Production'],
    required: false,
    description: 'Sentry error tracking DSN',
  },
  {
    name: 'GOOGLE_CLIENT_ID',
    environments: ['Production', 'Preview'],
    required: false,
    description: 'Gmail OAuth client ID',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    environments: ['Production', 'Preview'],
    required: false,
    description: 'Gmail OAuth client secret',
  },
]

function parseEnvList(output: string): Map<string, Set<string>> {
  const envMap = new Map<string, Set<string>>()
  const lines = output.split('\n').slice(2) // Skip header lines

  for (const line of lines) {
    if (!line.trim()) continue
    
    // Parse line: name value environments created
    const parts = line.split(/\s{2,}/)
    if (parts.length < 3) continue

    const name = parts[0].trim()
    const environments = parts[2].trim()

    if (!envMap.has(name)) {
      envMap.set(name, new Set())
    }

    // Parse environments (comma-separated)
    environments.split(',').forEach(env => {
      envMap.get(name)!.add(env.trim())
    })
  }

  return envMap
}

function checkVariable(
  name: string,
  requiredEnvs: string[],
  actualEnvs: Set<string>,
  required: boolean
): { status: 'success' | 'warning' | 'error'; message: string } {
  const missingEnvs = requiredEnvs.filter(env => !actualEnvs.has(env))

  if (missingEnvs.length === 0) {
    return {
      status: 'success',
      message: `✅ Set for: ${requiredEnvs.join(', ')}`,
    }
  }

  if (required) {
    return {
      status: 'error',
      message: `❌ Missing for: ${missingEnvs.join(', ')}`,
    }
  } else {
    return {
      status: 'warning',
      message: `⚠️  Missing for: ${missingEnvs.join(', ')} (optional)`,
    }
  }
}

async function main() {
  console.log('🔍 Verifying Vercel Environment Variables\n')
  console.log('='.repeat(60))

  try {
    // Get environment variables from Vercel
    const output = execSync('vercel env ls', { encoding: 'utf-8' })
    const envMap = parseEnvList(output)

    console.log('\n📋 Required Variables:\n')

    let hasErrors = false
    let hasWarnings = false

    // Check required variables
    for (const varDef of requiredVars) {
      const actualEnvs = envMap.get(varDef.name) || new Set()
      const result = checkVariable(
        varDef.name,
        varDef.environments,
        actualEnvs,
        varDef.required
      )

      console.log(`${varDef.name}:`)
      console.log(`  ${result.message}`)
      console.log(`  Description: ${varDef.description}`)

      if (result.status === 'error') {
        hasErrors = true
        console.log(`  ⚠️  Action: Add to missing environments`)
      }
      console.log()
    }

    // Check optional variables
    console.log('📋 Optional Variables:\n')
    for (const varDef of optionalVars) {
      const actualEnvs = envMap.get(varDef.name) || new Set()
      const result = checkVariable(
        varDef.name,
        varDef.environments,
        actualEnvs,
        varDef.required
      )

      if (result.status !== 'success') {
        console.log(`${varDef.name}:`)
        console.log(`  ${result.message}`)
        console.log(`  Description: ${varDef.description}`)
        console.log()
        hasWarnings = true
      }
    }

    // Summary
    console.log('='.repeat(60))
    console.log('\n📊 Verification Summary\n')

    if (hasErrors) {
      console.log('❌ Some required variables are missing!')
      console.log('\nTo add missing variables:')
      console.log('  vercel env add VARIABLE_NAME production')
      console.log('  vercel env add VARIABLE_NAME preview')
      process.exit(1)
    } else if (hasWarnings) {
      console.log('⚠️  All required variables are set!')
      console.log('Some optional variables are missing (not critical).')
      process.exit(0)
    } else {
      console.log('✅ All required variables are correctly configured!')
      process.exit(0)
    }
  } catch (error: any) {
    console.error('❌ Error checking environment variables:', error.message)
    console.error('\nMake sure you are:')
    console.error('  1. Logged in to Vercel: vercel login')
    console.error('  2. In the correct project directory')
    process.exit(1)
  }
}

main()

