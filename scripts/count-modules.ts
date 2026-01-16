/**
 * Count All Modules
 * 
 * Usage:
 *   npx tsx scripts/count-modules.ts
 */

import { modules } from '../lib/modules.config'

const activeModules = modules.filter(m => m.status !== 'deprecated' && m.category !== 'industry')
const allModules = modules.filter(m => m.status !== 'deprecated')

console.log('📊 Module Count Summary\n')
console.log(`Total modules (excluding deprecated): ${allModules.length}`)
console.log(`Active modules (excluding deprecated & industries): ${activeModules.length}\n`)

console.log('By Category:')
const byCategory = activeModules.reduce((acc, m) => {
  acc[m.category] = (acc[m.category] || 0) + 1
  return acc
}, {} as Record<string, number>)

Object.entries(byCategory).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`)
})

console.log('\n📋 Active Module List:')
activeModules.forEach(m => {
  console.log(`  - ${m.id}: ${m.name} (${m.category})`)
})

console.log('\n📦 Industry Modules (not counted as modules):')
const industryModules = modules.filter(m => m.category === 'industry')
console.log(`  Total: ${industryModules.length}`)
industryModules.forEach(m => {
  console.log(`    - ${m.id}: ${m.name}`)
})

console.log('\n⚠️  Deprecated Modules:')
const deprecatedModules = modules.filter(m => m.status === 'deprecated')
console.log(`  Total: ${deprecatedModules.length}`)
deprecatedModules.forEach(m => {
  console.log(`    - ${m.id}: ${m.name}`)
})

