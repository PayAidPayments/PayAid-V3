/**
 * Setup Git Repositories
 * 
 * Initializes git repositories and prepares them for GitHub
 * 
 * Usage: npx tsx scripts/setup-git-repositories.ts [--init-only]
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const MODULES = ['core', 'crm', 'finance', 'hr', 'marketing', 'whatsapp', 'analytics', 'ai-studio', 'communication']

function setupGitRepository(moduleName: string, initOnly: boolean = false) {
  const repoDir = `repositories/payaid-${moduleName}`
  
  if (!fs.existsSync(repoDir)) {
    console.warn(`⚠️  Repository not found: ${repoDir}`)
    console.log(`   Run: npx tsx scripts/create-module-repository.ts ${moduleName}`)
    return false
  }

  console.log(`\n📦 Setting up ${moduleName} module...`)

  try {
    // Check if git is already initialized
    const gitDir = path.join(repoDir, '.git')
    const isGitInitialized = fs.existsSync(gitDir)

    if (!isGitInitialized) {
      console.log(`   🔧 Initializing git repository...`)
      execSync('git init', { cwd: repoDir, stdio: 'inherit' })
      
      console.log(`   📝 Creating initial commit...`)
      execSync('git add .', { cwd: repoDir, stdio: 'inherit' })
      execSync('git commit -m "Initial commit: ' + moduleName.charAt(0).toUpperCase() + moduleName.slice(1) + ' module"', {
        cwd: repoDir,
        stdio: 'inherit',
      })
      
      console.log(`   ✅ Git repository initialized`)
    } else {
      console.log(`   ℹ️  Git repository already initialized`)
    }

    if (!initOnly) {
      // Check if remote exists
      try {
        const remotes = execSync('git remote', { cwd: repoDir, encoding: 'utf-8' })
        if (remotes.includes('origin')) {
          console.log(`   ℹ️  Remote 'origin' already exists`)
        } else {
          console.log(`   📋 Remote not configured. Add with:`)
          console.log(`      git remote add origin https://github.com/your-org/payaid-${moduleName}.git`)
        }
      } catch {
        console.log(`   📋 Configure remote with:`)
        console.log(`      git remote add origin https://github.com/your-org/payaid-${moduleName}.git`)
      }

      // Check current branch
      try {
        const branch = execSync('git branch --show-current', { cwd: repoDir, encoding: 'utf-8' }).trim()
        if (branch !== 'main') {
          console.log(`   🔄 Renaming branch to main...`)
          execSync('git branch -M main', { cwd: repoDir, stdio: 'inherit' })
        }
      } catch {
        // Branch might not exist yet
      }
    }

    return true
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`)
    return false
  }
}

async function main() {
  const initOnly = process.argv.includes('--init-only')
  
  console.log('🚀 Setting up Git repositories...\n')
  console.log(`Mode: ${initOnly ? 'Initialize only' : 'Full setup'}\n`)

  const results: { module: string; success: boolean }[] = []

  for (const module of MODULES) {
    const success = setupGitRepository(module, initOnly)
    results.push({ module, success })
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log('📊 Summary:')
  console.log('='.repeat(50))

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`✅ Successful: ${successful}`)
  console.log(`❌ Failed: ${failed}`)

  if (successful > 0) {
    console.log(`\n✅ Successfully set up:`)
    results.filter(r => r.success).forEach(r => {
      console.log(`   - ${r.module}`)
    })
  }

  if (failed > 0) {
    console.log(`\n❌ Failed to set up:`)
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.module}`)
    })
  }

  if (!initOnly) {
    console.log(`\n📋 Next steps:`)
    console.log(`   1. Create GitHub repositories:`)
    console.log(`      - Go to https://github.com/new`)
    console.log(`      - Create repositories: payaid-core, payaid-crm, payaid-finance, etc.`)
    console.log(`   2. Add remotes:`)
    console.log(`      cd repositories/payaid-<module>`)
    console.log(`      git remote add origin https://github.com/your-org/payaid-<module>.git`)
    console.log(`   3. Push to GitHub:`)
    console.log(`      git push -u origin main`)
    console.log(`   4. Set up CI/CD secrets in GitHub`)
  }
}

main().catch(console.error)

