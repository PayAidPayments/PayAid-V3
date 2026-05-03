/**
 * Script to update a module to Universal Design System
 * 
 * Usage: npx tsx scripts/update-module-to-uds.ts <module-id>
 * Example: npx tsx scripts/update-module-to-uds.ts marketing
 * 
 * This script helps identify what needs to be updated in a module:
 * - Check if UniversalModuleHero is used
 * - Check if GlassCard is used
 * - Check if formatINRForDisplay is used for currency
 * - Check if PayAid brand colors are used
 * - Check if module config is used
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const moduleId = process.argv[2]

if (!moduleId) {
  console.error('❌ Please provide a module ID')
  console.log('Usage: npx tsx scripts/update-module-to-uds.ts <module-id>')
  console.log('Example: npx tsx scripts/update-module-to-uds.ts marketing')
  process.exit(1)
}

const modulePath = join(process.cwd(), `app/${moduleId}/[tenantId]/Home/page.tsx`)

if (!existsSync(modulePath)) {
  console.error(`❌ Module page not found: ${modulePath}`)
  console.log('Expected path: app/<module-id>/[tenantId]/Home/page.tsx')
  process.exit(1)
}

console.log(`📋 Analyzing module: ${moduleId}`)
console.log(`📁 File: ${modulePath}\n`)

const content = readFileSync(modulePath, 'utf-8')

const checks = {
  'UniversalModuleHero': content.includes('UniversalModuleHero'),
  'GlassCard': content.includes('GlassCard'),
  'formatINRForDisplay': content.includes('formatINRForDisplay'),
  'getModuleConfig': content.includes('getModuleConfig'),
  'PayAid brand colors': content.includes('#53328A') || content.includes('#F5C700'),
  'UniversalModuleLayout': content.includes('UniversalModuleLayout'),
  'IndianRupee icon': content.includes('IndianRupee'),
  'DollarSign icon': content.includes('DollarSign'),
}

console.log('✅ UDS Compliance Check:\n')
Object.entries(checks).forEach(([check, passed]) => {
  const icon = passed ? '✅' : '❌'
  console.log(`  ${icon} ${check}`)
})

const allPassed = Object.values(checks).every(v => v)
const hasDollarSign = checks['DollarSign icon']

if (allPassed && !hasDollarSign) {
  console.log('\n✅ Module is fully compliant with Universal Design System!')
} else {
  console.log('\n⚠️  Module needs updates to be UDS compliant.')
  console.log('\n📝 Required updates:')
  
  if (!checks['UniversalModuleHero']) {
    console.log('  - Replace welcome banner with UniversalModuleHero')
  }
  if (!checks['GlassCard']) {
    console.log('  - Replace Card components with GlassCard for content sections')
  }
  if (!checks['formatINRForDisplay']) {
    console.log('  - Replace currency formatting with formatINRForDisplay()')
  }
  if (!checks['getModuleConfig']) {
    console.log('  - Use getModuleConfig() for module-specific settings')
  }
  if (!checks['PayAid brand colors']) {
    console.log('  - Update chart colors to PayAid brand colors (#53328A, #F5C700)')
  }
  if (!checks['UniversalModuleLayout']) {
    console.log('  - Wrap content with UniversalModuleLayout')
  }
  if (hasDollarSign) {
    console.log('  - Replace DollarSign icon with IndianRupee icon')
  }
  
  console.log('\n📚 Reference: components/modules/ModuleTemplate.tsx')
}
