/**
 * Prisma Client for Scripts
 * 
 * This is a standalone Prisma client for use in scripts.
 * It doesn't import server-only, so it can be used outside Next.js.
 */

import { PrismaClient } from '@prisma/client'

// Load environment variables from .env.production if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  try {
    const fs = require('fs')
    const path = require('path')
    const envFile = path.join(process.cwd(), '.env.production')
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf-8')
      envContent.split(/\r?\n/).forEach((line: string) => {
        // Skip comments and empty lines
        line = line.trim()
        if (!line || line.startsWith('#')) return
        
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          let value = match[2].trim()
          // Remove surrounding quotes and escape sequences
          value = value.replace(/^["']|["']$/g, '').replace(/\\r|\\n/g, '').trim()
          if (key && !process.env[key]) {
            process.env[key] = value
          }
        }
      })
    }
  } catch (error) {
    // Ignore errors
  }
}

function createPrismaClient(): PrismaClient {
  let databaseUrl = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set. Please set it in .env.production or environment.')
  }

  // Clean up the URL - remove quotes, newlines, and whitespace
  databaseUrl = databaseUrl.trim().replace(/^["']|["']$/g, '').replace(/\\r|\\n/g, '').trim()
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is empty after cleaning. Please check .env.production file.')
  }

  // Parse and enhance DATABASE_URL with connection pool parameters
  const url = new URL(databaseUrl)
  
  // Add connection pool parameters if not already present
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', '5')
  }
  
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', '10')
  }
  
  if (!url.searchParams.has('connect_timeout')) {
    url.searchParams.set('connect_timeout', '5')
  }

  // For Supabase pooler, ensure proper configuration
  if (url.hostname.includes('pooler.supabase.com')) {
    if (!url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true')
    }
  }

  const enhancedDatabaseUrl = url.toString()

  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: enhancedDatabaseUrl,
      },
    },
  })
}

export const prisma = createPrismaClient()
