import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { hashPassword } from '@/lib/auth/password'
import { signToken } from '@/lib/auth/jwt'
import { z } from 'zod'
import { checkTenantLimits } from '@/lib/middleware/tenant'
import { generateTenantId } from '@/lib/utils/tenant-id'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  tenantName: z.string().min(1),
  subdomain: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = registerSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Check if subdomain is available
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain: validated.subdomain },
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Subdomain already taken' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(validated.password)

    // Generate personalized tenant ID from business name
    // Get existing tenant IDs to ensure uniqueness
    const existingTenants = await prisma.tenant.findMany({
      select: { id: true },
    })
    const existingIds = existingTenants.map(t => t.id)
    
    // Generate tenant ID with retry logic in case of conflicts
    let personalizedTenantId = generateTenantId(validated.tenantName, existingIds)
    let attempts = 0
    while (existingIds.includes(personalizedTenantId) && attempts < 5) {
      personalizedTenantId = generateTenantId(validated.tenantName, existingIds)
      attempts++
    }

    // Create tenant and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant with personalized ID
      // Enable all 8 modules by default for new tenants (development/testing)
      const defaultModules = [
        'crm',
        'sales',
        'marketing',
        'finance',
        'hr',
        'communication',
        'ai-studio',
        'analytics',
      ]
      
      const tenant = await tx.tenant.create({
        data: {
          id: personalizedTenantId, // Use personalized ID instead of default CUID
          name: validated.tenantName,
          subdomain: validated.subdomain,
          plan: 'free',
          status: 'active',
          maxContacts: 50,
          maxInvoices: 10,
          maxUsers: 1,
          maxStorage: 1024, // 1GB
          licensedModules: defaultModules, // Enable all modules by default
          subscriptionTier: 'professional', // Set to professional tier for full access
        },
      })

      // Create user
      const user = await tx.user.create({
        data: {
          email: validated.email,
          name: validated.name,
          password: hashedPassword,
          role: 'owner',
          tenantId: tenant.id,
        },
      })

      return { tenant, user }
    })

    // Generate JWT token with licensed modules
    const token = signToken({
      userId: result.user.id,
      tenantId: result.tenant.id,
      email: result.user.email,
      role: result.user.role,
      licensedModules: result.tenant.licensedModules || [],
      subscriptionTier: result.tenant.subscriptionTier || 'free',
    })

    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        subdomain: result.tenant.subdomain,
        plan: result.tenant.plan,
        licensedModules: result.tenant.licensedModules || [],
        subscriptionTier: result.tenant.subscriptionTier || 'free',
      },
      token,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}

