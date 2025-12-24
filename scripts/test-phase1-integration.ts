/**
 * Phase 1 Integration Testing Script
 * 
 * Tests the licensing layer implementation:
 * - JWT token contains licensing info
 * - API routes enforce module access
 * - License errors return correct status codes
 * 
 * Usage:
 *   npx tsx scripts/test-phase1-integration.ts
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { signToken, verifyToken } from '../lib/auth/jwt'

const prisma = new PrismaClient()

// Test configuration
const TEST_USERS = {
  fullAccess: {
    email: 'test-full@example.com',
    password: 'Test@1234',
    licensedModules: ['crm', 'invoicing', 'accounting', 'hr', 'whatsapp', 'analytics'],
    subscriptionTier: 'professional',
  },
  crmOnly: {
    email: 'test-crm@example.com',
    password: 'Test@1234',
    licensedModules: ['crm'],
    subscriptionTier: 'starter',
  },
  freeTier: {
    email: 'test-free@example.com',
    password: 'Test@1234',
    licensedModules: [],
    subscriptionTier: 'free',
  },
}

interface TestResult {
  name: string
  passed: boolean
  error?: string
  details?: any
}

const results: TestResult[] = []

function logTest(name: string, passed: boolean, error?: string, details?: any) {
  results.push({ name, passed, error, details })
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${name}`)
  if (error) {
    console.log(`   Error: ${error}`)
  }
  if (details) {
    console.log(`   Details:`, JSON.stringify(details, null, 2))
  }
}

async function setupTestUsers() {
  console.log('\n🔧 Setting up test users...\n')

  const hashedPassword = await bcrypt.hash('Test@1234', 10)

  for (const [key, config] of Object.entries(TEST_USERS)) {
    // Create or update tenant
    const tenant = await prisma.tenant.upsert({
      where: { subdomain: `test-${key}` },
      update: {
        licensedModules: config.licensedModules,
        subscriptionTier: config.subscriptionTier,
      },
      create: {
        name: `Test Tenant ${key}`,
        subdomain: `test-${key}`,
        email: config.email,
        licensedModules: config.licensedModules,
        subscriptionTier: config.subscriptionTier,
        plan: config.subscriptionTier,
        status: 'active',
      },
    })

    // Create or update user
    await prisma.user.upsert({
      where: { email: config.email },
      update: {
        password: hashedPassword,
        tenantId: tenant.id,
      },
      create: {
        email: config.email,
        name: `Test User ${key}`,
        password: hashedPassword,
        role: 'owner',
        tenantId: tenant.id,
      },
    })

    console.log(`  ✅ Created test user: ${config.email}`)
  }
}

async function testJWTTokenGeneration() {
  console.log('\n🧪 Test Suite 1: JWT Token Generation\n')

  // Test 1.1: Token contains licensing info
  try {
    const user = await prisma.user.findUnique({
      where: { email: TEST_USERS.fullAccess.email },
      include: { tenant: true },
    })

    if (!user || !user.tenant) {
      throw new Error('Test user not found')
    }

    const token = signToken({
      userId: user.id,
      tenantId: user.tenant.id,
      email: user.email,
      role: user.role,
      licensedModules: user.tenant.licensedModules || [],
      subscriptionTier: user.tenant.subscriptionTier || 'free',
    })

    const decoded = verifyToken(token)

    const hasLicensedModules = Array.isArray(decoded.licensedModules)
    const hasSubscriptionTier = typeof decoded.subscriptionTier === 'string'
    const modulesMatch = JSON.stringify(decoded.licensedModules?.sort()) === 
      JSON.stringify(user.tenant.licensedModules.sort())

    logTest(
      'JWT contains licensedModules',
      hasLicensedModules,
      hasLicensedModules ? undefined : 'licensedModules missing from token',
      { modules: decoded.licensedModules }
    )

    logTest(
      'JWT contains subscriptionTier',
      hasSubscriptionTier,
      hasSubscriptionTier ? undefined : 'subscriptionTier missing from token',
      { tier: decoded.subscriptionTier }
    )

    logTest(
      'JWT modules match tenant modules',
      modulesMatch,
      modulesMatch ? undefined : 'Token modules do not match tenant modules',
      {
        token: decoded.licensedModules,
        tenant: user.tenant.licensedModules,
      }
    )
  } catch (error: any) {
    logTest('JWT Token Generation', false, error.message)
  }

  // Test 1.2: Different users have different tokens
  try {
    const crmUser = await prisma.user.findUnique({
      where: { email: TEST_USERS.crmOnly.email },
      include: { tenant: true },
    })

    const freeUser = await prisma.user.findUnique({
      where: { email: TEST_USERS.freeTier.email },
      include: { tenant: true },
    })

    if (!crmUser || !freeUser || !crmUser.tenant || !freeUser.tenant) {
      throw new Error('Test users not found')
    }

    const crmToken = signToken({
      userId: crmUser.id,
      tenantId: crmUser.tenant.id,
      email: crmUser.email,
      role: crmUser.role,
      licensedModules: crmUser.tenant.licensedModules || [],
      subscriptionTier: crmUser.tenant.subscriptionTier || 'free',
    })

    const freeToken = signToken({
      userId: freeUser.id,
      tenantId: freeUser.tenant.id,
      email: freeUser.email,
      role: freeUser.role,
      licensedModules: freeUser.tenant.licensedModules || [],
      subscriptionTier: freeUser.tenant.subscriptionTier || 'free',
    })

    const crmDecoded = verifyToken(crmToken)
    const freeDecoded = verifyToken(freeToken)

    const crmHasCrm = crmDecoded.licensedModules?.includes('crm') || false
    const freeHasNoModules = (freeDecoded.licensedModules?.length || 0) === 0

    logTest(
      'CRM-only user has CRM in token',
      crmHasCrm,
      crmHasCrm ? undefined : 'CRM user missing CRM module',
      { modules: crmDecoded.licensedModules }
    )

    logTest(
      'Free tier user has no modules',
      freeHasNoModules,
      freeHasNoModules ? undefined : 'Free user has modules when should be empty',
      { modules: freeDecoded.licensedModules }
    )
  } catch (error: any) {
    logTest('Different User Tokens', false, error.message)
  }
}

async function testLicenseMiddleware() {
  console.log('\n🧪 Test Suite 2: License Middleware\n')

  const { checkModuleAccess } = await import('../lib/middleware/license')
  const { NextRequest } = await import('next/server')

  // Test 2.1: Licensed module access
  try {
    const user = await prisma.user.findUnique({
      where: { email: TEST_USERS.fullAccess.email },
      include: { tenant: true },
    })

    if (!user || !user.tenant) {
      throw new Error('Test user not found')
    }

    const token = signToken({
      userId: user.id,
      tenantId: user.tenant.id,
      email: user.email,
      role: user.role,
      licensedModules: user.tenant.licensedModules || [],
      subscriptionTier: user.tenant.subscriptionTier || 'free',
    })

    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    const result = await checkModuleAccess(request, 'crm')

    const passed = result.tenantId === user.tenant.id && 
                   result.licensedModules.includes('crm')

    logTest(
      'Licensed module access succeeds',
      passed,
      passed ? undefined : 'Should allow access to licensed module',
      { result }
    )
  } catch (error: any) {
    logTest('Licensed Module Access', false, error.message)
  }

  // Test 2.2: Unlicensed module access
  try {
    const user = await prisma.user.findUnique({
      where: { email: TEST_USERS.crmOnly.email },
      include: { tenant: true },
    })

    if (!user || !user.tenant) {
      throw new Error('Test user not found')
    }

    const token = signToken({
      userId: user.id,
      tenantId: user.tenant.id,
      email: user.email,
      role: user.role,
      licensedModules: user.tenant.licensedModules || [],
      subscriptionTier: user.tenant.subscriptionTier || 'free',
    })

    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    try {
      await checkModuleAccess(request, 'invoicing')
      logTest('Unlicensed module access fails', false, 'Should throw LicenseError')
    } catch (error: any) {
      const isLicenseError = error.name === 'LicenseError' || 
                            error.message?.includes('not licensed')
      logTest(
        'Unlicensed module access throws error',
        isLicenseError,
        isLicenseError ? undefined : 'Should throw LicenseError',
        { error: error.message }
      )
    }
  } catch (error: any) {
    logTest('Unlicensed Module Access', false, error.message)
  }

  // Test 2.3: Missing token
  try {
    const request = new NextRequest('http://localhost:3000/api/test')

    try {
      await checkModuleAccess(request, 'crm')
      logTest('Missing token fails', false, 'Should throw LicenseError')
    } catch (error: any) {
      const isLicenseError = error.name === 'LicenseError' || 
                            error.message?.includes('authorization token')
      logTest(
        'Missing token throws error',
        isLicenseError,
        isLicenseError ? undefined : 'Should throw LicenseError for missing token',
        { error: error.message }
      )
    }
  } catch (error: any) {
    logTest('Missing Token', false, error.message)
  }
}

async function testDatabaseSchema() {
  console.log('\n🧪 Test Suite 3: Database Schema\n')

  // Test 3.1: ModuleDefinition table exists and has data
  try {
    const modules = await prisma.moduleDefinition.findMany()
    const expectedModules = ['crm', 'invoicing', 'accounting', 'hr', 'whatsapp', 'analytics']
    const moduleIds = modules.map(m => m.moduleId)

    const allModulesExist = expectedModules.every(id => moduleIds.includes(id))

    logTest(
      'ModuleDefinition table has all 6 modules',
      allModulesExist,
      allModulesExist ? undefined : 'Missing modules in database',
      { found: moduleIds, expected: expectedModules }
    )
  } catch (error: any) {
    logTest('ModuleDefinition Table', false, error.message)
  }

  // Test 3.2: Tenant has licensing fields
  try {
    const user = await prisma.user.findUnique({
      where: { email: TEST_USERS.fullAccess.email },
      include: { tenant: true },
    })
    
    const tenant = user?.tenant

    const hasLicensedModules = 'licensedModules' in (tenant || {})
    const hasSubscriptionTier = 'subscriptionTier' in (tenant || {})

    logTest(
      'Tenant has licensedModules field',
      hasLicensedModules,
      hasLicensedModules ? undefined : 'licensedModules field missing',
      { tenant: tenant ? { licensedModules: tenant.licensedModules } : null }
    )

    logTest(
      'Tenant has subscriptionTier field',
      hasSubscriptionTier,
      hasSubscriptionTier ? undefined : 'subscriptionTier field missing',
      { tenant: tenant ? { subscriptionTier: tenant.subscriptionTier } : null }
    )
  } catch (error: any) {
    logTest('Tenant Licensing Fields', false, error.message)
  }
}

async function main() {
  console.log('🚀 Starting Phase 1 Integration Tests\n')
  console.log('=' .repeat(60))

  try {
    // Setup
    await setupTestUsers()

    // Run tests
    await testDatabaseSchema()
    await testJWTTokenGeneration()
    await testLicenseMiddleware()

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('\n📊 Test Results Summary\n')

    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length
    const total = results.length

    console.log(`Total Tests: ${total}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.name}`)
          if (r.error) {
            console.log(`    Error: ${r.error}`)
          }
        })
    }

    console.log('\n' + '='.repeat(60))

    if (failed === 0) {
      console.log('\n🎉 All tests passed! Phase 1 integration is working correctly.')
      process.exit(0)
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.')
      process.exit(1)
    }
  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
