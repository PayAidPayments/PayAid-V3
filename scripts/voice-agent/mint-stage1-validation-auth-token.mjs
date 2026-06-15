#!/usr/bin/env node
/**
 * Mint a short-lived PayAid JWT for Stage 1 analytics/latency scripts (stdout only).
 * Requires JWT_SECRET and an active user in TENANT_ID with ai-studio access.
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

dotenv.config({ path: path.join(process.cwd(), '.env.local'), quiet: true })
dotenv.config({ quiet: true })

const tenantId = process.env.TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
const secret = (process.env.JWT_SECRET || '').trim()
if (!secret || secret === 'change-me-in-production') {
  console.error('JWT_SECRET must be set in .env / .env.local')
  process.exit(1)
}

if (process.env.STAGE1_VALIDATION_AUTH_TOKEN?.trim()) {
  process.stdout.write(process.env.STAGE1_VALIDATION_AUTH_TOKEN.trim())
  process.exit(0)
}

function mintOffline() {
  const userId = process.env.STAGE1_VALIDATION_USER_ID || 'stage1_validation_user'
  const email = process.env.STAGE1_VALIDATION_EMAIL || 'admin@demo.com'
  const role = process.env.STAGE1_VALIDATION_ROLE || 'owner'
  return jwt.sign(
    {
      sub: userId,
      email,
      tenant_id: tenantId,
      tenantId,
      roles: [role],
      permissions: [],
      modules: ['ai-studio', 'crm', 'sales', 'marketing', 'finance', 'hr', 'communication', 'analytics'],
      licensedModules: ['ai-studio', 'crm', 'sales', 'marketing', 'finance', 'hr', 'communication', 'analytics'],
    },
    secret,
    { expiresIn: '1h' },
  )
}

const prisma = new PrismaClient()
try {
  const user = await prisma.user.findFirst({
    where: { tenantId },
    select: { id: true, email: true, role: true },
    orderBy: { updatedAt: 'desc' },
  })
  if (!user?.id) {
    process.stdout.write(mintOffline())
    process.exit(0)
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { licensedModules: true, subscriptionTier: true },
  })

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email || 'validation@payaid.local',
      tenant_id: tenantId,
      tenantId,
      roles: [user.role || 'admin'],
      permissions: [],
      modules: tenant?.licensedModules || ['ai-studio'],
      licensedModules: tenant?.licensedModules || ['ai-studio'],
    },
    secret,
    { expiresIn: '1h' },
  )

  process.stdout.write(token)
} catch (error) {
  const offline = mintOffline()
  console.error(
    JSON.stringify(
      {
        warn: 'DB mint failed; using offline JWT (set STAGE1_VALIDATION_AUTH_TOKEN to override)',
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  )
  process.stdout.write(offline)
} finally {
  await prisma.$disconnect()
}
