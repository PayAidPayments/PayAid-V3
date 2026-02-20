/**
 * API Endpoints Test Script
 * Tests multi-currency and tax engine API endpoints
 * 
 * Run with: npx tsx scripts/test-api-endpoints.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mock auth headers for testing
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  // In real testing, you'd use actual auth token
  // 'Authorization': `Bearer ${token}`
})

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testCurrencyEndpoints() {
  console.log('\n🧪 Testing Currency Endpoints...\n')

  try {
    // Test 1: GET /api/currencies
    console.log('1. Testing GET /api/currencies')
    const currenciesRes = await fetch(`${BASE_URL}/api/currencies`, {
      headers: getAuthHeaders(),
    })
    
    if (currenciesRes.ok) {
      const currencies = await currenciesRes.json()
      console.log('✅ GET /api/currencies - SUCCESS')
      console.log(`   Found ${currencies.currencies?.length || 0} currencies`)
      console.log(`   Sample: ${JSON.stringify(currencies.currencies?.slice(0, 3), null, 2)}`)
    } else {
      console.log('❌ GET /api/currencies - FAILED')
      console.log(`   Status: ${currenciesRes.status}`)
      console.log(`   Error: ${await currenciesRes.text()}`)
    }
  } catch (error: any) {
    console.log('❌ GET /api/currencies - ERROR')
    console.log(`   ${error.message}`)
  }

  try {
    // Test 2: GET /api/currencies/rates
    console.log('\n2. Testing GET /api/currencies/rates?base=INR')
    const ratesRes = await fetch(`${BASE_URL}/api/currencies/rates?base=INR`, {
      headers: getAuthHeaders(),
    })
    
    if (ratesRes.ok) {
      const rates = await ratesRes.json()
      console.log('✅ GET /api/currencies/rates - SUCCESS')
      console.log(`   Base: ${rates.baseCurrency || 'INR'}`)
      console.log(`   Rates: ${Object.keys(rates.rates || {}).length} currencies`)
      console.log(`   Sample rates: ${JSON.stringify(Object.entries(rates.rates || {}).slice(0, 3), null, 2)}`)
    } else {
      console.log('❌ GET /api/currencies/rates - FAILED')
      console.log(`   Status: ${ratesRes.status}`)
      console.log(`   Error: ${await ratesRes.text()}`)
    }
  } catch (error: any) {
    console.log('❌ GET /api/currencies/rates - ERROR')
    console.log(`   ${error.message}`)
  }

  try {
    // Test 3: POST /api/currencies/rates (Update rates)
    console.log('\n3. Testing POST /api/currencies/rates')
    const updateRatesRes = await fetch(`${BASE_URL}/api/currencies/rates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        baseCurrency: 'INR',
        targetCurrencies: ['USD', 'EUR', 'GBP'],
      }),
    })
    
    if (updateRatesRes.ok) {
      const result = await updateRatesRes.json()
      console.log('✅ POST /api/currencies/rates - SUCCESS')
      console.log(`   Updated ${result.updated || 0} rates`)
      console.log(`   Rates: ${JSON.stringify(result.rates, null, 2)}`)
    } else {
      console.log('❌ POST /api/currencies/rates - FAILED')
      console.log(`   Status: ${updateRatesRes.status}`)
      console.log(`   Error: ${await updateRatesRes.text()}`)
    }
  } catch (error: any) {
    console.log('❌ POST /api/currencies/rates - ERROR')
    console.log(`   ${error.message}`)
  }
}

async function testTaxEndpoints() {
  console.log('\n🧪 Testing Tax Engine Endpoints...\n')

  try {
    // Test 1: GET /api/tax/rules
    console.log('1. Testing GET /api/tax/rules')
    const rulesRes = await fetch(`${BASE_URL}/api/tax/rules`, {
      headers: getAuthHeaders(),
    })
    
    if (rulesRes.ok) {
      const rules = await rulesRes.json()
      console.log('✅ GET /api/tax/rules - SUCCESS')
      console.log(`   Found ${rules.rules?.length || 0} tax rules`)
      if (rules.rules && rules.rules.length > 0) {
        console.log(`   Sample rule: ${JSON.stringify(rules.rules[0], null, 2)}`)
      }
    } else {
      console.log('❌ GET /api/tax/rules - FAILED')
      console.log(`   Status: ${rulesRes.status}`)
      console.log(`   Error: ${await rulesRes.text()}`)
    }
  } catch (error: any) {
    console.log('❌ GET /api/tax/rules - ERROR')
    console.log(`   ${error.message}`)
  }

  try {
    // Test 2: POST /api/tax/rules (Create tax rule)
    console.log('\n2. Testing POST /api/tax/rules')
    const createRuleRes = await fetch(`${BASE_URL}/api/tax/rules`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: 'Test GST 18%',
        taxType: 'GST',
        rate: 18,
        isDefault: false,
        appliesTo: 'all',
        isExempt: false,
      }),
    })
    
    if (createRuleRes.ok) {
      const rule = await createRuleRes.json()
      console.log('✅ POST /api/tax/rules - SUCCESS')
      console.log(`   Created rule: ${rule.rule?.name || rule.name}`)
      console.log(`   Rule ID: ${rule.rule?.id || rule.id}`)
      
      // Store rule ID for cleanup
      return rule.rule?.id || rule.id
    } else {
      console.log('❌ POST /api/tax/rules - FAILED')
      console.log(`   Status: ${createRuleRes.status}`)
      const errorText = await createRuleRes.text()
      console.log(`   Error: ${errorText}`)
      return null
    }
  } catch (error: any) {
    console.log('❌ POST /api/tax/rules - ERROR')
    console.log(`   ${error.message}`)
    return null
  }
}

async function testTaxCalculation() {
  console.log('\n🧪 Testing Tax Calculation...\n')

  try {
    // Test: POST /api/tax/calculate
    console.log('Testing POST /api/tax/calculate')
    const calcRes = await fetch(`${BASE_URL}/api/tax/calculate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        items: [
          {
            name: 'Test Product 1',
            quantity: 2,
            unitPrice: 1000,
            taxType: 'GST',
            taxRate: 18,
          },
          {
            name: 'Test Product 2',
            quantity: 1,
            unitPrice: 500,
            taxType: 'GST',
            taxRate: 12,
          },
        ],
      }),
    })
    
    if (calcRes.ok) {
      const calculation = await calcRes.json()
      console.log('✅ POST /api/tax/calculate - SUCCESS')
      console.log(`   Subtotal: ${calculation.subtotal}`)
      console.log(`   Total Tax: ${calculation.totalTax}`)
      console.log(`   Total: ${calculation.total}`)
      console.log(`   Tax Breakdown:`)
      if (calculation.taxBreakdown) {
        calculation.taxBreakdown.forEach((item: any, index: number) => {
          console.log(`     Item ${index + 1}: ${item.taxAmount} (${item.taxRate}%)`)
        })
      }
      if (calculation.taxByType) {
        console.log(`   Tax by Type:`)
        Object.entries(calculation.taxByType).forEach(([type, amount]) => {
          console.log(`     ${type}: ${amount}`)
        })
      }
    } else {
      console.log('❌ POST /api/tax/calculate - FAILED')
      console.log(`   Status: ${calcRes.status}`)
      console.log(`   Error: ${await calcRes.text()}`)
    }
  } catch (error: any) {
    console.log('❌ POST /api/tax/calculate - ERROR')
    console.log(`   ${error.message}`)
  }
}

async function cleanupTestData(ruleId: string | null) {
  if (ruleId) {
    try {
      console.log(`\n🧹 Cleaning up test tax rule: ${ruleId}`)
      const deleteRes = await fetch(`${BASE_URL}/api/tax/rules/${ruleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      
      if (deleteRes.ok) {
        console.log('✅ Test rule deleted successfully')
      } else {
        console.log('⚠️  Could not delete test rule (may need manual cleanup)')
      }
    } catch (error: any) {
      console.log(`⚠️  Cleanup error: ${error.message}`)
    }
  }
}

async function main() {
  console.log('🚀 Starting API Endpoints Test Suite\n')
  console.log(`Base URL: ${BASE_URL}\n`)

  // Test Currency Endpoints
  await testCurrencyEndpoints()

  // Test Tax Endpoints
  const testRuleId = await testTaxEndpoints()

  // Test Tax Calculation
  await testTaxCalculation()

  // Cleanup
  await cleanupTestData(testRuleId)

  console.log('\n✅ Test Suite Complete!\n')
  
  await prisma.$disconnect()
}

// Run tests
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
