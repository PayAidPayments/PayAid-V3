/**
 * Verify Video Templates
 * Checks if all configured templates exist in public/video-templates/
 */

import { existsSync } from 'fs'
import { join } from 'path'
import { VIDEO_TEMPLATES } from '../lib/ai-influencer/video-templates'

async function verifyTemplates() {
  console.log('🔍 Verifying video templates...\n')

  const results = {
    found: [] as string[],
    missing: [] as string[],
    total: VIDEO_TEMPLATES.length,
  }

  for (const template of VIDEO_TEMPLATES) {
    const templatePath = join(process.cwd(), 'public', template.videoUrl)
    const exists = existsSync(templatePath)

    if (exists) {
      results.found.push(template.name)
      console.log(`✅ ${template.name}`)
      console.log(`   ${template.videoUrl}`)
    } else {
      results.missing.push(template.name)
      console.log(`❌ ${template.name} - NOT FOUND`)
      console.log(`   Expected: ${template.videoUrl}`)
    }
    console.log('')
  }

  // Summary
  console.log('📊 Summary:')
  console.log(`   Total templates configured: ${results.total}`)
  console.log(`   ✅ Found: ${results.found.length}`)
  console.log(`   ❌ Missing: ${results.missing.length}`)
  console.log('')

  if (results.missing.length > 0) {
    console.log('⚠️  Missing templates:')
    results.missing.forEach((name) => console.log(`   - ${name}`))
    console.log('')
  }

  if (results.found.length === results.total) {
    console.log('✅ All templates are available!')
    return 0
  } else {
    console.log('⚠️  Some templates are missing. Video generation may fail for some styles.')
    return 1
  }
}

verifyTemplates().catch(console.error)

