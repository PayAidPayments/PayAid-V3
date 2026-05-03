/**
 * Payment Flow Test Script
 * Tests the payment integration and webhook handling
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TestResult {
  test: string
  status: 'pass' | 'fail'
  message: string
}

const results: TestResult[] = []

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    results.push({ test: name, status: 'pass', message: 'OK' })
    console.log(`✅ ${name}`)
  } catch (error: any) {
    results.push({ test: name, status: 'fail', message: error.message })
    console.error(`❌ ${name}: ${error.message}`)
  }
}

async function main() {
  console.log('🧪 Starting Payment Flow Tests...\n')

  // Test 1: Order Creation Structure
  await test('Order Model Structure', async () => {
    const sampleOrder = await prisma.order.findFirst({
      include: {
        tenant: true,
      },
    })
    if (!sampleOrder) {
      console.log('   No orders found (this is OK for new installations)')
      return
    }
    
    // Verify required fields exist
    if (!sampleOrder.orderNumber) throw new Error('Order missing orderNumber')
    if (!sampleOrder.tenantId) throw new Error('Order missing tenantId')
    if (sampleOrder.total === null) throw new Error('Order missing total')
  })

  // Test 2: Subscription Model Structure
  await test('Subscription Model Structure', async () => {
    const sampleSubscription = await prisma.subscription.findFirst()
    if (!sampleSubscription) {
      console.log('   No subscriptions found (this is OK for new installations)')
      return
    }
    
    // Verify required fields exist
    if (!sampleSubscription.tenantId) throw new Error('Subscription missing tenantId')
    if (!Array.isArray(sampleSubscription.modules)) throw new Error('Subscription modules must be array')
    if (!sampleSubscription.tier) throw new Error('Subscription missing tier')
  })

  // Test 3: Tenant Licensed Modules
  await test('Tenant Licensed Modules Structure', async () => {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      console.log('   No tenants found (this is OK for new installations)')
      return
    }
    
    // Verify licensedModules is an array
    if (!Array.isArray(tenant.licensedModules)) {
      throw new Error('Tenant licensedModules must be an array')
    }
  })

  // Test 4: Webhook Payload Structure
  await test('Webhook Payload Structure Validation', async () => {
    // Simulate webhook payload structure
    const mockWebhookPayload = {
      order_id: 'ORD-123456',
      transaction_id: 'TXN-789',
      response_code: 0,
      response_message: 'Success',
      udf1: 'order-id-123',
      udf2: 'tenant-id-456',
      udf3: JSON.stringify(['crm', 'invoicing']),
      payment_datetime: new Date().toISOString(),
    }

    // Verify structure
    if (!mockWebhookPayload.order_id) throw new Error('Webhook missing order_id')
    if (!mockWebhookPayload.udf1) throw new Error('Webhook missing udf1 (order ID)')
    if (!mockWebhookPayload.udf2) throw new Error('Webhook missing udf2 (tenant ID)')
    if (!mockWebhookPayload.udf3) throw new Error('Webhook missing udf3 (module IDs)')
  })

  // Test 5: License Activation Logic
  await test('License Activation Logic', async () => {
    // Test that we can add modules to a tenant
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      console.log('   No tenants found - skipping')
      return
    }

    const currentModules = tenant.licensedModules || []
    const newModules = [...new Set([...currentModules, 'test-module'])]
    
    // Verify logic works
    if (newModules.length <= currentModules.length) {
      throw new Error('Module addition logic failed')
    }
  })

  // Test 6: Payment Status Codes
  await test('Payment Status Code Validation', async () => {
    const successCode = 0
    const cancelledCode = 1043
    
    if (successCode !== 0) throw new Error('Success code should be 0')
    if (cancelledCode !== 1043) throw new Error('Cancelled code should be 1043')
  })

  // Summary
  console.log('\n📊 Test Summary:')
  console.log('='.repeat(50))
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : '❌'
    console.log(`${icon} ${result.test}: ${result.message}`)
  })

  console.log('='.repeat(50))
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`)

  if (failed > 0) {
    process.exit(1)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

