/**
 * Migrate Frontend Pages to Modules
 * 
 * Migrates frontend pages from app/dashboard/ to module directories
 * Updates imports and module gates
 * 
 * Usage: npx tsx scripts/migrate-frontend-pages.ts
 */

import * as fs from 'fs'
import * as path from 'path'

interface PageMapping {
  source: string
  target: string
  module: string
  moduleId: string
}

const PAGE_MAPPINGS: PageMapping[] = [
  // CRM Module
  { source: 'app/dashboard/contacts', target: 'crm-module/app/dashboard/contacts', module: 'CRM', moduleId: 'crm' },
  { source: 'app/dashboard/deals', target: 'crm-module/app/dashboard/deals', module: 'CRM', moduleId: 'crm' },
  { source: 'app/dashboard/products', target: 'crm-module/app/dashboard/products', module: 'CRM', moduleId: 'crm' },
  { source: 'app/dashboard/orders', target: 'crm-module/app/dashboard/orders', module: 'CRM', moduleId: 'crm' },
  { source: 'app/dashboard/tasks', target: 'crm-module/app/dashboard/tasks', module: 'CRM', moduleId: 'crm' },
  { source: 'app/dashboard/landing-pages', target: 'crm-module/app/dashboard/landing-pages', module: 'CRM', moduleId: 'crm' },
  { source: 'app/dashboard/checkout-pages', target: 'crm-module/app/dashboard/checkout-pages', module: 'CRM', moduleId: 'crm' },
  { source: 'app/dashboard/events', target: 'crm-module/app/dashboard/events', module: 'CRM', moduleId: 'crm' },
  
  // Finance Module (Invoicing + Accounting)
  { source: 'app/dashboard/invoices', target: 'finance-module/app/dashboard/invoices', module: 'Finance', moduleId: 'finance' },
  { source: 'app/dashboard/accounting', target: 'finance-module/app/dashboard/accounting', module: 'Finance', moduleId: 'finance' },
  { source: 'app/dashboard/gst', target: 'finance-module/app/dashboard/gst', module: 'Finance', moduleId: 'finance' },
  
  // HR Module
  { source: 'app/dashboard/hr', target: 'hr-module/app/dashboard/hr', module: 'HR', moduleId: 'hr' },
  
  // Marketing Module
  { source: 'app/dashboard/marketing', target: 'marketing-module/app/dashboard/marketing', module: 'Marketing', moduleId: 'marketing' },
  { source: 'app/dashboard/email-templates', target: 'marketing-module/app/dashboard/email-templates', module: 'Marketing', moduleId: 'marketing' },
  
  // WhatsApp Module
  { source: 'app/dashboard/whatsapp', target: 'whatsapp-module/app/dashboard/whatsapp', module: 'WhatsApp', moduleId: 'whatsapp' },
  
  // Analytics Module
  { source: 'app/dashboard/analytics', target: 'analytics-module/app/dashboard/analytics', module: 'Analytics', moduleId: 'analytics' },
  { source: 'app/dashboard/reports', target: 'analytics-module/app/dashboard/reports', module: 'Analytics', moduleId: 'analytics' },
  { source: 'app/dashboard/dashboards', target: 'analytics-module/app/dashboard/dashboards', module: 'Analytics', moduleId: 'analytics' },
  
  // AI Studio Module
  { source: 'app/dashboard/ai', target: 'ai-studio-module/app/dashboard/ai', module: 'AI Studio', moduleId: 'ai-studio' },
  { source: 'app/dashboard/calls', target: 'ai-studio-module/app/dashboard/calls', module: 'AI Studio', moduleId: 'ai-studio' },
  { source: 'app/dashboard/websites', target: 'ai-studio-module/app/dashboard/websites', module: 'AI Studio', moduleId: 'ai-studio' },
  { source: 'app/dashboard/logos', target: 'ai-studio-module/app/dashboard/logos', module: 'AI Studio', moduleId: 'ai-studio' },
  
  // Communication Module
  { source: 'app/dashboard/email', target: 'communication-module/app/dashboard/email', module: 'Communication', moduleId: 'communication' },
  { source: 'app/dashboard/chat', target: 'communication-module/app/dashboard/chat', module: 'Communication', moduleId: 'communication' },
  
  // Core Module
  { source: 'app/dashboard/settings', target: 'core-module/app/dashboard/settings', module: 'Core', moduleId: 'core' },
  { source: 'app/dashboard/admin', target: 'core-module/app/dashboard/admin', module: 'Core', moduleId: 'core' },
  { source: 'app/dashboard/billing', target: 'core-module/app/dashboard/billing', module: 'Core', moduleId: 'core' },
  { source: 'app/dashboard/setup', target: 'core-module/app/dashboard/setup', module: 'Core', moduleId: 'core' },
]

function copyDirectory(source: string, target: string): number {
  if (!fs.existsSync(source)) {
    return 0
  }

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true })
  }

  let fileCount = 0
  const files = fs.readdirSync(source)

  for (const file of files) {
    const sourcePath = path.join(source, file)
    const targetPath = path.join(target, file)

    if (fs.statSync(sourcePath).isDirectory()) {
      fileCount += copyDirectory(sourcePath, targetPath)
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      // Read file content
      let content = fs.readFileSync(sourcePath, 'utf-8')
      
      // Update imports (basic updates - may need manual review)
      // Update @/ imports to relative or keep as-is if shared
      
      // Write to target
      fs.writeFileSync(targetPath, content, 'utf-8')
      fileCount++
    }
  }

  return fileCount
}

function addModuleGate(filePath: string, moduleId: string): void {
  if (!fs.existsSync(filePath) || !filePath.endsWith('.tsx')) {
    return
  }

  let content = fs.readFileSync(filePath, 'utf-8')
  
  // Check if ModuleGate is already present
  if (content.includes('ModuleGate') || content.includes('module="')) {
    return // Already has module gate
  }

  // Check if it's a page component (has 'use client' or 'export default')
  if (!content.includes('export default') && !content.includes('export async function')) {
    return // Not a page component
  }

  // Add ModuleGate import and wrapper
  const moduleGateImport = `import { ModuleGate } from '@/components/modules/ModuleGate'\n`
  
  // Find the default export or main component
  // This is a simplified version - may need manual review
  if (content.includes('export default function')) {
    const functionMatch = content.match(/export default function\s+(\w+)/)
    if (functionMatch) {
      const componentName = functionMatch[1]
      // Wrap component with ModuleGate
      content = content.replace(
        `export default function ${componentName}`,
        `function ${componentName}`
      )
      content += `\n\nexport default function Page() {\n  return (\n    <ModuleGate module="${moduleId}">\n      <${componentName} />\n    </ModuleGate>\n  )\n}\n`
      content = moduleGateImport + content
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8')
}

async function main() {
  console.log('🔄 Migrating frontend pages to modules...\n')

  let totalFiles = 0
  let successCount = 0
  let failCount = 0
  const failures: string[] = []

  for (const mapping of PAGE_MAPPINGS) {
    const sourcePath = path.join(process.cwd(), mapping.source)
    const targetPath = path.join(process.cwd(), mapping.target)

    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠️  Source does not exist: ${mapping.source}`)
      failCount++
      failures.push(mapping.source)
      continue
    }

    try {
      const fileCount = copyDirectory(sourcePath, targetPath)
      
      // Add ModuleGate to main page.tsx files
      const mainPagePath = path.join(targetPath, 'page.tsx')
      if (fs.existsSync(mainPagePath)) {
        addModuleGate(mainPagePath, mapping.moduleId)
      }

      if (fileCount > 0) {
        console.log(`✅ ${mapping.module}: ${mapping.source} → ${mapping.target} (${fileCount} files)`)
        totalFiles += fileCount
        successCount++
      } else {
        console.warn(`⚠️  No files copied: ${mapping.source}`)
        failCount++
        failures.push(mapping.source)
      }
    } catch (error: any) {
      console.error(`❌ Error migrating ${mapping.source}:`, error.message)
      failCount++
      failures.push(mapping.source)
    }
  }

  // Migrate main dashboard page
  const mainDashboardSource = path.join(process.cwd(), 'app/dashboard/page.tsx')
  const mainDashboardTarget = path.join(process.cwd(), 'core-module/app/dashboard/page.tsx')
  if (fs.existsSync(mainDashboardSource)) {
    try {
      if (!fs.existsSync(path.dirname(mainDashboardTarget))) {
        fs.mkdirSync(path.dirname(mainDashboardTarget), { recursive: true })
      }
      fs.copyFileSync(mainDashboardSource, mainDashboardTarget)
      console.log(`✅ Core: app/dashboard/page.tsx → core-module/app/dashboard/page.tsx`)
      totalFiles++
      successCount++
    } catch (error: any) {
      console.error(`❌ Error migrating main dashboard:`, error.message)
      failCount++
      failures.push('app/dashboard/page.tsx')
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Migrated: ${successCount} page directories`)
  console.log(`   ❌ Failed: ${failCount} page directories`)
  console.log(`   📁 Total files: ${totalFiles}`)

  if (failures.length > 0) {
    console.log(`\n❌ Failed migrations:`)
    failures.forEach(f => console.log(`   - ${f}`))
  }

  console.log(`\n✅ Frontend migration complete!`)
  console.log(`\n⚠️  Next steps:`)
  console.log(`   1. Review migrated pages`)
  console.log(`   2. Update imports if needed`)
  console.log(`   3. Update navigation`)
  console.log(`   4. Test OAuth2 SSO`)
  console.log(`   5. Test cross-module navigation`)
}

main().catch(console.error)

