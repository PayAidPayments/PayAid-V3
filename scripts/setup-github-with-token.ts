/**
 * Setup GitHub Repositories with Access Token
 * 
 * Creates GitHub repositories and configures them using access token
 * 
 * Usage: npx tsx scripts/setup-github-with-token.ts --token <token> --org <org-name>
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const MODULES = ['core', 'crm', 'finance', 'hr', 'marketing', 'whatsapp', 'analytics', 'ai-studio', 'communication']

interface GitHubRepo {
  name: string
  description: string
  private: boolean
}

function createGitHubRepository(token: string, orgName: string, repo: GitHubRepo): boolean {
  const repoName = `payaid-${repo.name}`
  const fullRepoName = `${orgName}/${repoName}`
  
  console.log(`📦 Creating repository: ${fullRepoName}...`)

  try {
    // Create repository using GitHub API
    const createRepoUrl = `https://api.github.com/orgs/${orgName}/repos`
    
    const response = fetch(createRepoUrl, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description: repo.description,
        private: repo.private,
        auto_init: false, // We'll push existing code
      }),
    })

    return true
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`)
    return false
  }
}

function setupRemote(repoDir: string, orgName: string, moduleName: string, token: string): boolean {
  try {
    // Check if remote exists
    try {
      const remotes = execSync('git remote', { cwd: repoDir, encoding: 'utf-8' })
      if (remotes.includes('origin')) {
        console.log(`   ℹ️  Remote 'origin' already exists, updating...`)
        execSync(`git remote set-url origin https://${token}@github.com/${orgName}/payaid-${moduleName}.git`, {
          cwd: repoDir,
          stdio: 'inherit',
        })
      } else {
        execSync(`git remote add origin https://${token}@github.com/${orgName}/payaid-${moduleName}.git`, {
          cwd: repoDir,
          stdio: 'inherit',
        })
      }
      return true
    } catch {
      // Remote doesn't exist, add it
      execSync(`git remote add origin https://${token}@github.com/${orgName}/payaid-${moduleName}.git`, {
        cwd: repoDir,
        stdio: 'inherit',
      })
      return true
    }
  } catch (error: any) {
    console.error(`   ❌ Error setting up remote: ${error.message}`)
    return false
  }
}

function pushToGitHub(repoDir: string, moduleName: string): boolean {
  try {
    // Ensure on main branch
    try {
      execSync('git checkout main', { cwd: repoDir, stdio: 'pipe' })
    } catch {
      execSync('git checkout -b main', { cwd: repoDir, stdio: 'pipe' })
    }

    // Push to GitHub
    execSync('git push -u origin main', {
      cwd: repoDir,
      stdio: 'inherit',
    })
    return true
  } catch (error: any) {
    console.error(`   ⚠️  Push failed: ${error.message}`)
    return false
  }
}

async function main() {
  const args = process.argv.slice(2)
  const tokenIndex = args.indexOf('--token')
  const orgIndex = args.indexOf('--org')
  const privateFlag = args.includes('--private')

  if (tokenIndex === -1 || !args[tokenIndex + 1]) {
    console.error('❌ GitHub token required')
    console.log('Usage: npx tsx scripts/setup-github-with-token.ts --token <token> --org <org-name> [--private]')
    process.exit(1)
  }

  if (orgIndex === -1 || !args[orgIndex + 1]) {
    console.error('❌ Organization name required')
    console.log('Usage: npx tsx scripts/setup-github-with-token.ts --token <token> --org <org-name> [--private]')
    process.exit(1)
  }

  const token = args[tokenIndex + 1]
  const orgName = args[orgIndex + 1]

  console.log('🚀 Setting up GitHub repositories...\n')
  console.log(`Organization: ${orgName}`)
  console.log(`Private repositories: ${privateFlag ? 'Yes' : 'No'}\n`)

  const moduleDescriptions: Record<string, string> = {
    core: 'Core platform module - OAuth2 Provider, License Management, App Store',
    crm: 'Customer Relationship Management module',
    finance: 'Finance module - Invoicing & Accounting',
    hr: 'Human Resources & Payroll module',
    marketing: 'Marketing & Campaigns module',
    whatsapp: 'WhatsApp Business module',
    analytics: 'Analytics & Reporting module',
    'ai-studio': 'AI Studio module',
    communication: 'Communication module',
  }

  const results: { module: string; created: boolean; remote: boolean; pushed: boolean }[] = []

  for (const module of MODULES) {
    const repoDir = `repositories/payaid-${module}`
    
    if (!fs.existsSync(repoDir)) {
      console.warn(`⚠️  Repository directory not found: ${repoDir}`)
      continue
    }

    console.log(`\n${'='.repeat(50)}`)
    console.log(`Setting up ${module} module...`)
    console.log('='.repeat(50))

    // Step 1: Create GitHub repository
    const repo: GitHubRepo = {
      name: module,
      description: moduleDescriptions[module] || `${module} module`,
      private: privateFlag,
    }

    let created = false
    try {
      // Use GitHub API to create repository
      const createRepoUrl = `https://api.github.com/orgs/${orgName}/repos`
      const repoName = `payaid-${module}`
      
      const response = await fetch(createRepoUrl, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          description: repo.description,
          private: repo.private,
          auto_init: false,
        }),
      })

      if (response.ok || response.status === 422) {
        // 422 means repository already exists, which is okay
        created = true
        console.log(`   ✅ Repository created/exists: ${orgName}/${repoName}`)
      } else {
        const error = await response.text()
        console.error(`   ❌ Failed to create repository: ${response.status} - ${error}`)
      }
    } catch (error: any) {
      console.error(`   ❌ Error creating repository: ${error.message}`)
    }

    // Step 2: Initialize Git (if not already done)
    if (!fs.existsSync(path.join(repoDir, '.git'))) {
      console.log(`   🔧 Initializing git repository...`)
      try {
        execSync('git init', { cwd: repoDir, stdio: 'inherit' })
        execSync('git add .', { cwd: repoDir, stdio: 'inherit' })
        execSync(`git commit -m "Initial commit: ${module.charAt(0).toUpperCase() + module.slice(1)} module"`, {
          cwd: repoDir,
          stdio: 'inherit',
        })
        execSync('git branch -M main', { cwd: repoDir, stdio: 'inherit' })
        console.log(`   ✅ Git initialized`)
      } catch (error: any) {
        console.error(`   ❌ Error initializing git: ${error.message}`)
      }
    }

    // Step 3: Setup remote
    const remoteSetup = setupRemote(repoDir, orgName, module, token)
    console.log(`   ${remoteSetup ? '✅' : '❌'} Remote configured`)

    // Step 4: Push to GitHub
    const pushed = pushToGitHub(repoDir, module)
    console.log(`   ${pushed ? '✅' : '⚠️'} Pushed to GitHub`)

    results.push({ module, created, remote: remoteSetup, pushed })
  }

  // Summary
  console.log(`\n${'='.repeat(50)}`)
  console.log('📊 Summary:')
  console.log('='.repeat(50))
  
  const created = results.filter(r => r.created).length
  const remotes = results.filter(r => r.remote).length
  const pushed = results.filter(r => r.pushed).length

  console.log(`✅ Repositories created: ${created}/${MODULES.length}`)
  console.log(`✅ Remotes configured: ${remotes}/${MODULES.length}`)
  console.log(`✅ Pushed to GitHub: ${pushed}/${MODULES.length}`)

  console.log(`\n📋 Next steps:`)
  console.log(`   1. Verify repositories on GitHub: https://github.com/${orgName}`)
  console.log(`   2. Set up CI/CD secrets (see: scripts/setup-cicd-secrets.md)`)
  console.log(`   3. Configure branch protection rules`)
  console.log(`   4. Set up deployment environments`)
}

main().catch(console.error)

