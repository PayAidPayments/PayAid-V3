/**
 * Test Cross-Module Navigation
 * 
 * Tests navigation between modules:
 * 1. Navigate from core to CRM
 * 2. Navigate from CRM to Finance
 * 3. Navigate from Finance to HR
 * 4. Verify OAuth2 SSO works
 * 
 * Usage: npx tsx scripts/test-cross-module-navigation.ts
 */

import { getModuleLink, requiresSSO } from '../lib/navigation/module-navigation'

function testCrossModuleNavigation() {
  console.log('🧪 Testing Cross-Module Navigation...\n')

  const testCases = [
    { from: 'core', to: 'crm', path: '/dashboard/contacts' },
    { from: 'crm', to: 'finance', path: '/dashboard/invoices' },
    { from: 'finance', to: 'hr', path: '/dashboard/hr/employees' },
    { from: 'hr', to: 'analytics', path: '/dashboard/analytics' },
    { from: 'analytics', to: 'ai-studio', path: '/dashboard/ai/chat' },
    { from: 'ai-studio', to: 'communication', path: '/dashboard/email/accounts' },
    { from: 'communication', to: 'marketing', path: '/dashboard/marketing/campaigns' },
    { from: 'marketing', to: 'whatsapp', path: '/dashboard/whatsapp/accounts' },
  ]

  console.log('Testing module links:\n')
  
  testCases.forEach((testCase, index) => {
    const link = getModuleLink(testCase.to, testCase.path)
    const needsSSO = requiresSSO(testCase.to)
    
    console.log(`${index + 1}. ${testCase.from} → ${testCase.to}`)
    console.log(`   Path: ${testCase.path}`)
    console.log(`   Link: ${link}`)
    console.log(`   Requires SSO: ${needsSSO ? '✅ Yes' : '❌ No'}`)
    console.log('')
  })

  console.log('✅ Cross-module navigation test complete!')
  console.log('\n📝 Next steps:')
  console.log('   1. Test in browser')
  console.log('   2. Verify OAuth2 SSO redirects')
  console.log('   3. Test token persistence')
  console.log('   4. Test logout flow')
}

testCrossModuleNavigation()

