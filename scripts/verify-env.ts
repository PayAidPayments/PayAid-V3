#!/usr/bin/env tsx
/**
 * Environment Variables Verification Script
 * 
 * This script verifies that all required environment variables are set
 * for both local development and Vercel deployment.
 * 
 * Usage:
 *   npx tsx scripts/verify-env.ts [--vercel]
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// Required environment variables for the application to work
const REQUIRED_VARS = {
  // Critical - Application won't work without these
  critical: [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
  ],
  // Important - Core features won't work without these
  important: [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'NODE_ENV',
    'APP_URL',
    'NEXT_PUBLIC_APP_URL',
  ],
  // Optional - Features may be limited without these
  optional: [
    'ENCRYPTION_KEY',
    'REDIS_URL',
    'GROQ_API_KEY',
    'HUGGINGFACE_API_KEY',
    'GEMINI_API_KEY',
    'SENDGRID_API_KEY',
    'PAYAID_ADMIN_API_KEY',
    'PAYAID_ADMIN_SALT',
  ],
}

interface EnvCheckResult {
  name: string
  isSet: boolean
  value?: string
  category: 'critical' | 'important' | 'optional'
  issues: string[]
}

function checkEnvVar(name: string, category: 'critical' | 'important' | 'optional'): EnvCheckResult {
  const value = process.env[name]
  const isSet = !!value
  const issues: string[] = []

  if (!isSet) {
    if (category === 'critical') {
      issues.push('❌ MISSING - Application will not work without this')
    } else if (category === 'important') {
      issues.push('⚠️  MISSING - Core features may not work')
    } else {
      issues.push('ℹ️  MISSING - Optional feature')
    }
  } else {
    // Validate specific variables
    if (name === 'DATABASE_URL') {
      if (value.includes('localhost') || value.includes('127.0.0.1')) {
        issues.push('⚠️  WARNING - Using localhost (will not work on Vercel)')
      }
      if (!value.startsWith('postgresql://')) {
        issues.push('⚠️  WARNING - Should start with postgresql://')
      }
    }

    if (name === 'JWT_SECRET') {
      if (value === 'your-secret-key-change-in-production' || value.length < 32) {
        issues.push('❌ INSECURE - Must be a strong random secret (64+ characters recommended)')
      }
    }

    if (name === 'NEXTAUTH_SECRET') {
      if (value === 'your-nextauth-secret-change-in-production' || value.length < 32) {
        issues.push('❌ INSECURE - Must be a strong random secret (64+ characters recommended)')
      }
    }

    if (name === 'NEXTAUTH_URL' || name === 'APP_URL' || name === 'NEXT_PUBLIC_APP_URL') {
      if (value.includes('localhost') && process.env.NODE_ENV === 'production') {
        issues.push('⚠️  WARNING - Using localhost in production')
      }
    }

    if (name === 'NODE_ENV') {
      if (value !== 'production' && value !== 'development' && value !== 'test') {
        issues.push('⚠️  WARNING - Should be production, development, or test')
      }
    }
  }

  return {
    name,
    isSet,
    value: isSet ? (name.includes('SECRET') || name.includes('KEY') || name.includes('PASSWORD') 
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}` 
      : value) : undefined,
    category,
    issues,
  }
}

function printResults(results: EnvCheckResult[]) {
  console.log('\n' + '='.repeat(80))
  console.log('🔍 ENVIRONMENT VARIABLES VERIFICATION')
  console.log('='.repeat(80) + '\n')

  const critical = results.filter(r => r.category === 'critical')
  const important = results.filter(r => r.category === 'important')
  const optional = results.filter(r => r.category === 'optional')

  // Critical variables
  console.log('🔴 CRITICAL VARIABLES (Application will not work without these):\n')
  critical.forEach(result => {
    const status = result.isSet ? '✅' : '❌'
    console.log(`  ${status} ${result.name.padEnd(25)} ${result.isSet ? result.value : 'NOT SET'}`)
    result.issues.forEach(issue => console.log(`     ${issue}`))
  })

  console.log('\n' + '-'.repeat(80) + '\n')

  // Important variables
  console.log('🟡 IMPORTANT VARIABLES (Core features may not work without these):\n')
  important.forEach(result => {
    const status = result.isSet ? '✅' : '⚠️ '
    console.log(`  ${status} ${result.name.padEnd(25)} ${result.isSet ? result.value : 'NOT SET'}`)
    result.issues.forEach(issue => console.log(`     ${issue}`))
  })

  console.log('\n' + '-'.repeat(80) + '\n')

  // Optional variables
  console.log('🟢 OPTIONAL VARIABLES (Features may be limited without these):\n')
  optional.forEach(result => {
    const status = result.isSet ? '✅' : 'ℹ️ '
    console.log(`  ${status} ${result.name.padEnd(25)} ${result.isSet ? result.value : 'NOT SET'}`)
    result.issues.forEach(issue => console.log(`     ${issue}`))
  })

  console.log('\n' + '='.repeat(80) + '\n')

  // Summary
  const criticalMissing = critical.filter(r => !r.isSet).length
  const importantMissing = important.filter(r => !r.isSet).length
  const criticalIssues = critical.filter(r => r.issues.some(i => i.startsWith('❌'))).length

  console.log('📊 SUMMARY:\n')
  console.log(`  Critical Variables:     ${critical.length - criticalMissing}/${critical.length} set`)
  console.log(`  Important Variables:   ${important.length - importantMissing}/${important.length} set`)
  console.log(`  Optional Variables:    ${optional.filter(r => r.isSet).length}/${optional.length} set`)
  console.log(`  Critical Issues:       ${criticalIssues} found\n`)

  if (criticalMissing > 0 || criticalIssues > 0) {
    console.log('❌ ACTION REQUIRED: Fix critical issues before deployment!\n')
    process.exit(1)
  } else if (importantMissing > 0) {
    console.log('⚠️  WARNING: Some important variables are missing. Review above.\n')
    process.exit(0)
  } else {
    console.log('✅ All critical and important variables are set!\n')
    process.exit(0)
  }
}

function checkVercelEnv() {
  console.log('\n🔍 Checking Vercel Environment Variables...\n')
  console.log('To check Vercel environment variables:')
  console.log('1. Go to https://vercel.com/dashboard')
  console.log('2. Select your project: PayAid V3')
  console.log('3. Go to Settings → Environment Variables')
  console.log('4. Verify all required variables are set for Production and Preview environments\n')
  
  console.log('Or use Vercel CLI:')
  console.log('  vercel env ls\n')
}

async function main() {
  const args = process.argv.slice(2)
  const checkVercel = args.includes('--vercel')

  // Load .env file if it exists (for local checking)
  try {
    const envPath = join(process.cwd(), '.env')
    const envContent = readFileSync(envPath, 'utf-8')
    const envLines = envContent.split('\n')
    
    envLines.forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').replace(/^["']|["']$/g, '')
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  } catch (error) {
    // .env file doesn't exist, that's okay
  }

  // Check all variables
  const results: EnvCheckResult[] = []

  REQUIRED_VARS.critical.forEach(name => {
    results.push(checkEnvVar(name, 'critical'))
  })

  REQUIRED_VARS.important.forEach(name => {
    results.push(checkEnvVar(name, 'important'))
  })

  REQUIRED_VARS.optional.forEach(name => {
    results.push(checkEnvVar(name, 'optional'))
  })

  printResults(results)

  if (checkVercel) {
    checkVercelEnv()
  }
}

main().catch(console.error)

