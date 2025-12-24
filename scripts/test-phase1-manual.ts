/**
 * Phase 1 Manual Testing Script
 * 
 * Tests actual API endpoints, frontend components, and admin panel
 * This script simulates real user interactions
 * 
 * Usage:
 *   npx tsx scripts/test-phase1-manual.ts
 * 
 * Prerequisites:
 *   - Dev server running on localhost:3000
 *   - Test users created (from integration test)
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { signToken } from '../lib/auth/jwt'

const prisma = new PrismaClient()
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

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

async function getTestUserToken(email: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    })

    if (!user || !user.tenant) {
      return null
    }

    return signToken({
      userId: user.id,
      tenantId: user.tenant.id,
      email: user.email,
      role: user.role,
      licensedModules: user.tenant.licensedModules || [],
      subscriptionTier: user.tenant.subscriptionTier || 'free',
    })
  } catch (error) {
    return null
  }
}

async function testAPIEndpoint(
  method: string,
  endpoint: string,
  token: string | null,
  expectedStatus: number,
  moduleId?: string
): Promise<{ status: number; body: any }> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
    })

    const body = await response.json().catch(() => ({}))

    return {
      status: response.status,
      body,
    }
  } catch (error: any) {
    throw new Error(`Request failed: ${error.message}`)
  }
}

async function testAPIRoutes() {
  console.log('\n🧪 Test Suite 1: API Endpoint Testing\n')

  // Get tokens for different users
  const fullAccessToken = await getTestUserToken('test-full@example.com')
  const crmOnlyToken = await getTestUserToken('test-crm@example.com')
  const freeToken = await getTestUserToken('test-free@example.com')

  if (!fullAccessToken || !crmOnlyToken || !freeToken) {
    logTest('Get test user tokens', false, 'Could not generate tokens for test users')
    return
  }

  // Test 1.1: Licensed module access (should succeed)
  try {
    const result = await testAPIEndpoint('GET', '/api/contacts', fullAccessToken, 200, 'crm')
    logTest(
      'GET /api/contacts with CRM license',
      result.status === 200,
      result.status !== 200 ? `Expected 200, got ${result.status}` : undefined,
      { status: result.status }
    )
  } catch (error: any) {
    logTest('GET /api/contacts with CRM license', false, error.message)
  }

  // Test 1.2: Unlicensed module access (should fail with 403)
  try {
    const result = await testAPIEndpoint('GET', '/api/invoices', crmOnlyToken, 403, 'invoicing')
    const is403 = result.status === 403
    const hasErrorCode = result.body?.code === 'MODULE_NOT_LICENSED' || 
                         result.body?.error?.includes('not licensed')
    
    logTest(
      'GET /api/invoices without license (should return 403)',
      is403 && hasErrorCode,
      !is403 ? `Expected 403, got ${result.status}` : 
      !hasErrorCode ? 'Missing MODULE_NOT_LICENSED error code' : undefined,
      { status: result.status, body: result.body }
    )
  } catch (error: any) {
    logTest('GET /api/invoices without license', false, error.message)
  }

  // Test 1.3: HR module access with license
  try {
    const result = await testAPIEndpoint('GET', '/api/hr/employees', fullAccessToken, 200, 'hr')
    logTest(
      'GET /api/hr/employees with HR license',
      result.status === 200,
      result.status !== 200 ? `Expected 200, got ${result.status}` : undefined,
      { status: result.status }
    )
  } catch (error: any) {
    logTest('GET /api/hr/employees with HR license', false, error.message)
  }

  // Test 1.4: HR module access without license
  try {
    const result = await testAPIEndpoint('GET', '/api/hr/employees', crmOnlyToken, 403, 'hr')
    const is403 = result.status === 403
    
    logTest(
      'GET /api/hr/employees without license (should return 403)',
      is403,
      !is403 ? `Expected 403, got ${result.status}` : undefined,
      { status: result.status, body: result.body }
    )
  } catch (error: any) {
    logTest('GET /api/hr/employees without license', false, error.message)
  }

  // Test 1.5: Missing token (should fail)
  try {
    const result = await testAPIEndpoint('GET', '/api/contacts', null, 403)
    const is403 = result.status === 403
    const hasAuthError = result.body?.error?.includes('authorization') || 
                        result.body?.error?.includes('token')
    
    logTest(
      'GET /api/contacts without token (should return 403)',
      is403 && hasAuthError,
      !is403 ? `Expected 403, got ${result.status}` : 
      !hasAuthError ? 'Missing authorization error message' : undefined,
      { status: result.status, body: result.body }
    )
  } catch (error: any) {
    logTest('GET /api/contacts without token', false, error.message)
  }

  // Test 1.6: Admin API - Get modules
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'test-full@example.com' },
      include: { tenant: true },
    })

    if (user && user.tenant) {
      const result = await testAPIEndpoint(
        'GET',
        `/api/admin/tenants/${user.tenant.id}/modules`,
        fullAccessToken,
        200
      )
      logTest(
        'GET /api/admin/tenants/[id]/modules',
        result.status === 200 && Array.isArray(result.body.licensedModules),
        result.status !== 200 ? `Expected 200, got ${result.status}` : 
        !Array.isArray(result.body.licensedModules) ? 'Response missing licensedModules array' : undefined,
        { status: result.status, hasModules: Array.isArray(result.body.licensedModules) }
      )
    }
  } catch (error: any) {
    logTest('GET /api/admin/tenants/[id]/modules', false, error.message)
  }
}

async function testAdminPanelAPI() {
  console.log('\n🧪 Test Suite 2: Admin Panel API Testing\n')

  const fullAccessToken = await getTestUserToken('test-full@example.com')
  if (!fullAccessToken) {
    logTest('Get admin token', false, 'Could not get admin token')
    return
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: 'test-full@example.com' },
      include: { tenant: true },
    })

    if (!user || !user.tenant) {
      logTest('Get test tenant', false, 'Test tenant not found')
      return
    }

    // Get current licenses
    const getResult = await testAPIEndpoint(
      'GET',
      `/api/admin/tenants/${user.tenant.id}/modules`,
      fullAccessToken,
      200
    )

    const currentModules = getResult.body?.licensedModules || []
    const hasCRM = currentModules.includes('crm')

    logTest(
      'Admin API - Get current licenses',
      getResult.status === 200 && Array.isArray(currentModules),
      getResult.status !== 200 ? `Expected 200, got ${getResult.status}` : undefined,
      { modules: currentModules }
    )

    // Test updating licenses (toggle CRM)
    const newModules = hasCRM
      ? currentModules.filter((m: string) => m !== 'crm')
      : [...currentModules, 'crm']

    const updateResult = await fetch(`${BASE_URL}/api/admin/tenants/${user.tenant.id}/modules`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${fullAccessToken}`,
      },
      body: JSON.stringify({ licensedModules: newModules }),
    })

    const updateBody = await updateResult.json().catch(() => ({}))

    logTest(
      'Admin API - Update licenses',
      updateResult.status === 200 && Array.isArray(updateBody.licensedModules),
      updateResult.status !== 200 ? `Expected 200, got ${updateResult.status}` : undefined,
      { 
        status: updateResult.status,
        oldModules: currentModules,
        newModules: updateBody.licensedModules 
      }
    )

    // Restore original state
    await fetch(`${BASE_URL}/api/admin/tenants/${user.tenant.id}/modules`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${fullAccessToken}`,
      },
      body: JSON.stringify({ licensedModules: currentModules }),
    })

  } catch (error: any) {
    logTest('Admin Panel API Tests', false, error.message)
  }
}

async function testJWTContent() {
  console.log('\n🧪 Test Suite 3: JWT Token Content Verification\n')

  try {
    const user = await prisma.user.findUnique({
      where: { email: 'test-full@example.com' },
      include: { tenant: true },
    })

    if (!user || !user.tenant) {
      logTest('Get test user', false, 'Test user not found')
      return
    }

    const token = signToken({
      userId: user.id,
      tenantId: user.tenant.id,
      email: user.email,
      role: user.role,
      licensedModules: user.tenant.licensedModules || [],
      subscriptionTier: user.tenant.subscriptionTier || 'free',
    })

    const { decodeToken } = await import('../lib/auth/jwt')
    const decoded = decodeToken(token)

    const hasLicensedModules = Array.isArray(decoded?.licensedModules)
    const hasSubscriptionTier = typeof decoded?.subscriptionTier === 'string'
    const modulesMatch = JSON.stringify(decoded?.licensedModules?.sort()) === 
      JSON.stringify(user.tenant.licensedModules.sort())

    logTest(
      'JWT contains licensedModules',
      hasLicensedModules,
      !hasLicensedModules ? 'licensedModules missing from decoded token' : undefined,
      { modules: decoded?.licensedModules }
    )

    logTest(
      'JWT contains subscriptionTier',
      hasSubscriptionTier,
      !hasSubscriptionTier ? 'subscriptionTier missing from decoded token' : undefined,
      { tier: decoded?.subscriptionTier }
    )

    logTest(
      'JWT modules match tenant modules',
      modulesMatch,
      !modulesMatch ? 'Token modules do not match tenant modules' : undefined,
      {
        token: decoded?.licensedModules,
        tenant: user.tenant.licensedModules,
      }
    )

  } catch (error: any) {
    logTest('JWT Content Verification', false, error.message)
  }
}

async function main() {
  console.log('🚀 Starting Phase 1 Manual Testing\n')
  console.log('='.repeat(60))
  console.log(`Base URL: ${BASE_URL}`)
  console.log('Note: Make sure dev server is running on localhost:3000\n')

  try {
    // Check if server is accessible
    try {
      const healthCheck = await fetch(`${BASE_URL}/api/auth/me`)
      if (healthCheck.status === 401 || healthCheck.status === 200) {
        console.log('✅ Server is accessible\n')
      } else {
        console.log('⚠️  Server responded with unexpected status:', healthCheck.status)
      }
    } catch (error) {
      console.log('❌ Cannot connect to server. Is it running on localhost:3000?')
      console.log('   Start server with: npm run dev\n')
      process.exit(1)
    }

    // Run tests
    await testJWTContent()
    await testAPIRoutes()
    await testAdminPanelAPI()

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
      console.log('\n🎉 All manual tests passed!')
      console.log('\n📝 Next Steps:')
      console.log('   1. Test frontend components manually in browser')
      console.log('   2. Test admin panel UI at /dashboard/admin/modules')
      console.log('   3. Test ModuleGate component on protected pages')
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
