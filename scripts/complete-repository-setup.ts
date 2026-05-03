/**
 * Complete Repository Setup
 * 
 * Orchestrates the complete setup process:
 * 1. Review repositories
 * 2. Initialize git repositories
 * 3. Create GitHub repositories (optional)
 * 4. Push to GitHub (optional)
 * 5. Set up CI/CD secrets (instructions)
 * 
 * Usage: npx tsx scripts/complete-repository-setup.ts [--skip-github] [--skip-push]
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const MODULES = ['core', 'crm', 'finance', 'hr', 'marketing', 'whatsapp', 'analytics', 'ai-studio', 'communication']

interface RepositoryStatus {
  module: string
  exists: boolean
  gitInitialized: boolean
  hasRemote: boolean
  branch: string | null
}

function checkRepositoryStatus(moduleName: string): RepositoryStatus {
  const repoDir = `repositories/payaid-${moduleName}`
  const exists = fs.existsSync(repoDir)
  const gitDir = path.join(repoDir, '.git')
  const gitInitialized = fs.existsSync(gitDir)
  
  let hasRemote = false
  let branch: string | null = null

  if (gitInitialized) {
    try {
      const remotes = execSync('git remote', { cwd: repoDir, encoding: 'utf-8' })
      hasRemote = remotes.includes('origin')
      
      try {
        branch = execSync('git branch --show-current', { cwd: repoDir, encoding: 'utf-8' }).trim()
      } catch {
        branch = null
      }
    } catch {
      // Git commands might fail
    }
  }

  return {
    module: moduleName,
    exists,
    gitInitialized,
    hasRemote,
    branch,
  }
}

function reviewRepositories() {
  console.log('📋 Reviewing repositories...\n')

  const statuses: RepositoryStatus[] = []
  
  for (const module of MODULES) {
    const status = checkRepositoryStatus(module)
    statuses.push(status)
    
    const statusIcon = status.exists ? '✅' : '❌'
    const gitIcon = status.gitInitialized ? '✅' : '❌'
    const remoteIcon = status.hasRemote ? '✅' : '❌'
    
    console.log(`${statusIcon} ${module.padEnd(15)} | Git: ${gitIcon} | Remote: ${remoteIcon} | Branch: ${status.branch || 'N/A'}`)
  }

  const existing = statuses.filter(s => s.exists).length
  const gitInit = statuses.filter(s => s.gitInitialized).length
  const hasRemote = statuses.filter(s => s.hasRemote).length

  console.log(`\n📊 Summary:`)
  console.log(`   Repositories: ${existing}/${MODULES.length}`)
  console.log(`   Git initialized: ${gitInit}/${existing}`)
  console.log(`   Remotes configured: ${hasRemote}/${existing}`)

  return statuses
}

async function main() {
  const skipGitHub = process.argv.includes('--skip-github')
  const skipPush = process.argv.includes('--skip-push')

  console.log('🚀 Complete Repository Setup\n')
  console.log('='.repeat(50))

  // Step 1: Review repositories
  console.log('\n📋 Step 1: Reviewing repositories...')
  const statuses = reviewRepositories()

  const missingRepos = statuses.filter(s => !s.exists)
  if (missingRepos.length > 0) {
    console.log(`\n⚠️  Missing repositories: ${missingRepos.map(s => s.module).join(', ')}`)
    console.log(`   Run: npx tsx scripts/create-module-repository.ts <module-name>`)
  }

  // Step 2: Initialize git repositories
  console.log('\n📋 Step 2: Initializing git repositories...')
  try {
    execSync('npx tsx scripts/setup-git-repositories.ts --init-only', { stdio: 'inherit' })
  } catch (error) {
    console.error('Error initializing git repositories:', error)
  }

  // Step 3: Create GitHub repositories (optional)
  if (!skipGitHub) {
    console.log('\n📋 Step 3: Creating GitHub repositories...')
    console.log('   ⚠️  This step requires GitHub CLI (gh)')
    console.log('   Run manually: ./scripts/create-github-repos.sh --org <org-name>')
  }

  // Step 4: Push to GitHub (optional)
  if (!skipPush && !skipGitHub) {
    console.log('\n📋 Step 4: Pushing to GitHub...')
    console.log('   ⚠️  This step requires remotes to be configured')
    console.log('   Run manually: ./scripts/push-to-github.sh')
  }

  // Step 5: CI/CD secrets setup
  console.log('\n📋 Step 5: Setting up CI/CD secrets...')
  console.log('   📖 See: scripts/setup-cicd-secrets.md')
  console.log('   Required secrets:')
  console.log('     - VERCEL_TOKEN')
  console.log('     - VERCEL_ORG_ID')
  console.log('     - VERCEL_PROJECT_ID')

  console.log('\n' + '='.repeat(50))
  console.log('✅ Setup complete!')
  console.log('='.repeat(50))
  
  console.log('\n📋 Next steps:')
  console.log('   1. Review repositories in ./repositories/')
  console.log('   2. Create GitHub repositories (if not done)')
  console.log('   3. Configure remotes:')
  console.log('      cd repositories/payaid-<module>')
  console.log('      git remote add origin https://github.com/your-org/payaid-<module>.git')
  console.log('   4. Push to GitHub:')
  console.log('      ./scripts/push-to-github.sh')
  console.log('   5. Set up CI/CD secrets:')
  console.log('      See: scripts/setup-cicd-secrets.md')
}

main().catch(console.error)

