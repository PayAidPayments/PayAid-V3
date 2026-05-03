/**
 * API route to create Super Admin and Business Admin test users.
 * Call: POST /api/admin/create-test-users
 * 
 * This works server-side and handles Supabase connections properly.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { hashPassword } from '@/lib/auth/password'
import { generateUniqueTenantSlug } from '@/lib/utils/generate-tenant-slug'

const SUPER_ADMIN_EMAIL = 'admin@payaidpayments.com'
const SUPER_ADMIN_NAME = 'PayAid Super Admin'
const SUPER_ADMIN_PASSWORD = 'PayAid_SuperAdmin_2025!'

const BUSINESS_ADMIN_EMAIL = 'businessadmin@demobusiness.com'
const BUSINESS_ADMIN_NAME = 'Business Admin'
const BUSINESS_ADMIN_PASSWORD = 'BusinessAdmin_2025!'

function assertAdminUtilityAccess(request?: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }
  const configuredSecret = process.env.ADMIN_UTILITY_SECRET?.trim()
  if (configuredSecret) {
    const provided = request?.headers.get('x-admin-utility-secret')?.trim()
    if (!provided || provided !== configuredSecret) {
      return NextResponse.json({ error: 'Unauthorized utility access' }, { status: 401 })
    }
  }
  return null
}

async function createUsers() {
  const superAdminHash = await hashPassword(SUPER_ADMIN_PASSWORD)
  const businessAdminHash = await hashPassword(BUSINESS_ADMIN_PASSWORD)

  // 1. PayAid Platform tenant (for Super Admin), or use first existing tenant
  let payaidTenant: { id: string }
  const existingSlugsForCreate = new Set(
    (await prisma.tenant.findMany({ where: { slug: { not: null } }, select: { slug: true } }))
      .map((t) => t.slug as string)
  )
  try {
    payaidTenant = await prisma.tenant.upsert({
      where: { subdomain: 'payaid-platform' },
      update: {},
      create: {
        name: 'PayAid Platform',
        slug: generateUniqueTenantSlug('PayAid Platform', existingSlugsForCreate),
        subdomain: 'payaid-platform',
        plan: 'enterprise',
        status: 'active',
        maxUsers: 100,
        maxContacts: 0,
        maxInvoices: 0,
        maxStorage: 10240,
        industry: 'professional-services',
        country: 'India',
      },
    })
  } catch (e) {
    const existing = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!existing) {
      throw new Error('No tenant found and could not create PayAid Platform tenant')
    }
    payaidTenant = existing
  }

  // 2. Super Admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    update: {
      name: SUPER_ADMIN_NAME,
      password: superAdminHash,
      role: 'super_admin',
      tenantId: payaidTenant.id,
    },
    create: {
      email: SUPER_ADMIN_EMAIL,
      name: SUPER_ADMIN_NAME,
      password: superAdminHash,
      role: 'super_admin',
      tenantId: payaidTenant.id,
    },
  })

  // 3. Demo Business tenant (for Business Admin)
  let demoTenant = await prisma.tenant.findUnique({
    where: { subdomain: 'demo' },
  })
  if (!demoTenant) {
    const existingSlugs = new Set(
      (await prisma.tenant.findMany({ where: { slug: { not: null } }, select: { slug: true } }))
        .map((t) => t.slug as string)
    )
    demoTenant = await prisma.tenant.create({
      data: {
        name: 'Demo Business Pvt Ltd',
        slug: generateUniqueTenantSlug('Demo Business Pvt Ltd', existingSlugs),
        subdomain: 'demo',
        plan: 'professional',
        status: 'active',
        maxUsers: 10,
        maxContacts: 1000,
        maxInvoices: 1000,
        maxStorage: 10240,
        industry: 'service-business',
        country: 'India',
        licensedModules: ['crm', 'finance', 'marketing', 'hr', 'projects', 'analytics'],
      },
    })
  }

  // 4. Business Admin user
  const businessAdmin = await prisma.user.upsert({
    where: { email: BUSINESS_ADMIN_EMAIL },
    update: {
      name: BUSINESS_ADMIN_NAME,
      password: businessAdminHash,
      role: 'admin',
      tenantId: demoTenant.id,
    },
    create: {
      email: BUSINESS_ADMIN_EMAIL,
      name: BUSINESS_ADMIN_NAME,
      password: businessAdminHash,
      role: 'admin',
      tenantId: demoTenant.id,
    },
  })

  return {
    superAdmin: {
      email: superAdmin.email,
      name: superAdmin.name,
      role: superAdmin.role,
      tenantId: superAdmin.tenantId,
    },
    businessAdmin: {
      email: businessAdmin.email,
      name: businessAdmin.name,
      role: businessAdmin.role,
      tenantId: businessAdmin.tenantId,
    },
  }
}

export async function GET(request: Request) {
  const gate = assertAdminUtilityAccess(request)
  if (gate) return gate
  try {
    const users = await createUsers()
    return NextResponse.json({
      success: true,
      message: 'Admin users created successfully',
      users,
      note: 'Utility completed. Credentials are never returned from API responses.',
    })
  } catch (error) {
    console.error('Failed to create admin users:', error)
    return NextResponse.json(
      {
        error: 'Failed to create admin users',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const gate = assertAdminUtilityAccess(request)
  if (gate) return gate
  try {
    const users = await createUsers()
    return NextResponse.json({
      success: true,
      message: 'Admin users created successfully',
      users,
      note: 'Utility completed. Credentials are never returned from API responses.',
    })
  } catch (error) {
    console.error('Failed to create admin users:', error)
    return NextResponse.json(
      {
        error: 'Failed to create admin users',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
