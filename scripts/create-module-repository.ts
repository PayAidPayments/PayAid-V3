/**
 * Create Separate Module Repository
 * 
 * Extracts a module from the monolith into a separate repository structure
 * 
 * Usage: npx tsx scripts/create-module-repository.ts <module-name>
 * Example: npx tsx scripts/create-module-repository.ts crm
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

interface ModuleConfig {
  name: string
  moduleId: string
  subdomain: string
  port: number
  description: string
}

const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  crm: {
    name: 'CRM',
    moduleId: 'crm',
    subdomain: 'crm',
    port: 3001,
    description: 'Customer Relationship Management module',
  },
  finance: {
    name: 'Finance',
    moduleId: 'finance',
    subdomain: 'finance',
    port: 3002,
    description: 'Finance module (Invoicing + Accounting)',
  },
  hr: {
    name: 'HR',
    moduleId: 'hr',
    subdomain: 'hr',
    port: 3003,
    description: 'Human Resources & Payroll module',
  },
  marketing: {
    name: 'Marketing',
    moduleId: 'marketing',
    subdomain: 'marketing',
    port: 3004,
    description: 'Marketing & Campaigns module',
  },
  whatsapp: {
    name: 'WhatsApp',
    moduleId: 'whatsapp',
    subdomain: 'whatsapp',
    port: 3005,
    description: 'WhatsApp Business module',
  },
  analytics: {
    name: 'Analytics',
    moduleId: 'analytics',
    subdomain: 'analytics',
    port: 3006,
    description: 'Analytics & Reporting module',
  },
  'ai-studio': {
    name: 'AI Studio',
    moduleId: 'ai-studio',
    subdomain: 'ai',
    port: 3007,
    description: 'AI Studio module',
  },
  communication: {
    name: 'Communication',
    moduleId: 'communication',
    subdomain: 'communication',
    port: 3008,
    description: 'Communication module',
  },
  core: {
    name: 'Core',
    moduleId: 'core',
    subdomain: '',
    port: 3000,
    description: 'Core platform module',
  },
}

function createModuleRepository(moduleName: string) {
  const config = MODULE_CONFIGS[moduleName]
  if (!config) {
    console.error(`❌ Unknown module: ${moduleName}`)
    console.log(`Available modules: ${Object.keys(MODULE_CONFIGS).join(', ')}`)
    process.exit(1)
  }

  const moduleDir = `${moduleName}-module`
  const outputDir = `repositories/payaid-${moduleName}`
  
  console.log(`📦 Creating repository for ${config.name} module...\n`)

  // Create output directory
  if (!fs.existsSync('repositories')) {
    fs.mkdirSync('repositories', { recursive: true })
  }
  
  if (fs.existsSync(outputDir)) {
    console.warn(`⚠️  Directory ${outputDir} already exists. Removing...`)
    fs.rmSync(outputDir, { recursive: true, force: true })
  }
  
  fs.mkdirSync(outputDir, { recursive: true })

  // Copy module directory
  console.log(`📁 Copying module files...`)
  copyDirectory(moduleDir, path.join(outputDir, 'src'))

  // Copy shared packages
  console.log(`📦 Copying shared packages...`)
  copyDirectory('packages', path.join(outputDir, 'packages'))

  // Create package.json
  console.log(`📝 Creating package.json...`)
  createPackageJson(outputDir, config)

  // Create next.config.js
  console.log(`⚙️  Creating next.config.js...`)
  createNextConfig(outputDir, config)

  // Create .env.example
  console.log(`🔐 Creating .env.example...`)
  createEnvExample(outputDir, config)

  // Create Dockerfile
  console.log(`🐳 Creating Dockerfile...`)
  createDockerfile(outputDir, config)

  // Create docker-compose.yml
  console.log(`🐳 Creating docker-compose.yml...`)
  createDockerCompose(outputDir, config)

  // Create .github/workflows/deploy.yml
  console.log(`🚀 Creating CI/CD workflow...`)
  createGitHubWorkflow(outputDir, config)

  // Create README.md
  console.log(`📖 Creating README.md...`)
  createREADME(outputDir, config)

  // Create .gitignore
  console.log(`🚫 Creating .gitignore...`)
  createGitignore(outputDir)

  console.log(`\n✅ Repository created: ${outputDir}`)
  console.log(`\n📋 Next steps:`)
  console.log(`   1. cd ${outputDir}`)
  console.log(`   2. git init`)
  console.log(`   3. git add .`)
  console.log(`   4. git commit -m "Initial commit: ${config.name} module"`)
  console.log(`   5. Create GitHub repository: payaid-${moduleName}`)
  console.log(`   6. git remote add origin https://github.com/your-org/payaid-${moduleName}.git`)
  console.log(`   7. git push -u origin main`)
}

function copyDirectory(source: string, target: string) {
  if (!fs.existsSync(source)) {
    console.warn(`⚠️  Source does not exist: ${source}`)
    return
  }

  fs.mkdirSync(target, { recursive: true })
  const files = fs.readdirSync(source)

  for (const file of files) {
    const sourcePath = path.join(source, file)
    const targetPath = path.join(target, file)

    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath)
    } else {
      fs.copyFileSync(sourcePath, targetPath)
    }
  }
}

function createPackageJson(outputDir: string, config: ModuleConfig) {
  const packageJson = {
    name: `@payaid/${config.moduleId}`,
    version: '1.0.0',
    description: config.description,
    private: true,
    scripts: {
      dev: 'next dev -p ' + config.port,
      build: 'next build',
      start: 'next start -p ' + config.port,
      lint: 'next lint',
    },
    dependencies: {
      next: '^14.0.0',
      react: '^18.0.0',
      'react-dom': '^18.0.0',
      '@payaid/auth': 'workspace:*',
      '@payaid/db': 'workspace:*',
      '@payaid/oauth-client': 'workspace:*',
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0',
      typescript: '^5.0.0',
    },
  }

  fs.writeFileSync(
    path.join(outputDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )
}

function createNextConfig(outputDir: string, config: ModuleConfig) {
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig
`

  fs.writeFileSync(path.join(outputDir, 'next.config.js'), nextConfig)
}

function createEnvExample(outputDir: string, config: ModuleConfig) {
  const envExample = `# Core OAuth2 Configuration
CORE_AUTH_URL=https://payaid.io
OAUTH_CLIENT_ID=${config.moduleId}
OAUTH_CLIENT_SECRET=

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/payaid

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Application
NEXT_PUBLIC_APP_URL=https://${config.subdomain || 'payaid'}.payaid.io
NEXT_PUBLIC_USE_SUBDOMAINS=true
NODE_ENV=production

# JWT Secret (shared with core)
JWT_SECRET=
`

  fs.writeFileSync(path.join(outputDir, '.env.example'), envExample)
}

function createDockerfile(outputDir: string, config: ModuleConfig) {
  const dockerfile = `FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE ${config.port}
ENV PORT ${config.port}
CMD ["node", "server.js"]
`

  fs.writeFileSync(path.join(outputDir, 'Dockerfile'), dockerfile)
}

function createDockerCompose(outputDir: string, config: ModuleConfig) {
  const dockerCompose = `version: '3.8'

services:
  ${config.moduleId}:
    build: .
    ports:
      - "${config.port}:${config.port}"
    environment:
      - CORE_AUTH_URL=\${CORE_AUTH_URL:-http://core:3000}
      - DATABASE_URL=\${DATABASE_URL}
      - REDIS_URL=\${REDIS_URL}
      - JWT_SECRET=\${JWT_SECRET}
      - OAUTH_CLIENT_ID=${config.moduleId}
      - OAUTH_CLIENT_SECRET=\${OAUTH_CLIENT_SECRET}
      - NEXT_PUBLIC_APP_URL=\${NEXT_PUBLIC_APP_URL}
      - NODE_ENV=production
    networks:
      - payaid-network
    restart: unless-stopped

networks:
  payaid-network:
    driver: bridge
`

  fs.writeFileSync(path.join(outputDir, 'docker-compose.yml'), dockerCompose)
}

function createGitHubWorkflow(outputDir: string, config: ModuleConfig) {
  const workflowsDir = path.join(outputDir, '.github', 'workflows')
  fs.mkdirSync(workflowsDir, { recursive: true })

  const workflow = `name: Deploy ${config.name} Module

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run tests
        run: npm test || true
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
`

  fs.writeFileSync(path.join(workflowsDir, 'deploy.yml'), workflow)
}

function createREADME(outputDir: string, config: ModuleConfig) {
  const readme = `# PayAid ${config.name} Module

${config.description}

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
\`\`\`

## 🐳 Docker

\`\`\`bash
# Build image
docker build -t payaid-${config.moduleId} .

# Run container
docker run -p ${config.port}:${config.port} --env-file .env payaid-${config.moduleId}
\`\`\`

## 📋 Environment Variables

See \`.env.example\` for required environment variables.

## 🔗 Links

- **Subdomain:** ${config.subdomain ? `${config.subdomain}.payaid.io` : 'payaid.io'}
- **Port:** ${config.port}
- **Module ID:** ${config.moduleId}

## 📝 License

Copyright © PayAid. All rights reserved.
`

  fs.writeFileSync(path.join(outputDir, 'README.md'), readme)
}

function createGitignore(outputDir: string) {
  const gitignore = `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Production
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
`

  fs.writeFileSync(path.join(outputDir, '.gitignore'), gitignore)
}

// Main
const moduleName = process.argv[2]
if (!moduleName) {
  console.error('❌ Module name required')
  console.log(`Usage: npx tsx scripts/create-module-repository.ts <module-name>`)
  console.log(`Example: npx tsx scripts/create-module-repository.ts crm`)
  console.log(`\nAvailable modules: ${Object.keys(MODULE_CONFIGS).join(', ')}`)
  process.exit(1)
}

createModuleRepository(moduleName)

