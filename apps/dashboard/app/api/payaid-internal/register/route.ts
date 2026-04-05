import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { hashPassword } from '@/lib/auth/password'
import { signToken, signRefreshToken } from '@/lib/auth/jwt'
import { z } from 'zod'
import {
  inferPlanTypeFromSelection,
  resolveLicensedModules,
  SignupModuleResolutionError,
  type SignupPlanType,
} from '@/lib/modules/catalog'

const DEFAULT_TRIAL_DAYS = 30

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  tenantName: z.string().min(1),
  subdomain: z.string().regex(/^[a-z0-9-]+$/),
  planType: z.enum(['single', 'multi', 'suite']).optional(),
  selectedModules: z.array(z.string()).optional().default([]),
})

function resolvePlanType(input: z.infer<typeof registerSchema>): SignupPlanType | null {
  if (input.planType) return input.planType
  return inferPlanTypeFromSelection(input.selectedModules ?? [])
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
      select: { id: true },
    })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const existingTenant = await prisma.tenant.findFirst({
      where: { subdomain: input.subdomain.toLowerCase().trim() },
      select: { id: true },
    })
    if (existingTenant) {
      return NextResponse.json({ error: 'Subdomain already in use' }, { status: 409 })
    }

    const planType = resolvePlanType(input)
    if (!planType) {
      return NextResponse.json(
        {
          error:
            'Provide planType (single, multi, or suite). For single/multi, send at least one valid module in selectedModules.',
        },
        { status: 400 }
      )
    }

    let selectedModules: string[]
    try {
      selectedModules = resolveLicensedModules(
        planType,
        planType === 'suite' ? [] : (input.selectedModules ?? [])
      )
    } catch (err) {
      if (err instanceof SignupModuleResolutionError) {
        return NextResponse.json({ error: err.message }, { status: 400 })
      }
      throw err
    }

    const now = new Date()
    const trialEndsAt = new Date(now.getTime() + DEFAULT_TRIAL_DAYS * 24 * 60 * 60 * 1000)

    const passwordHash = await hashPassword(input.password)

    const created = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName.trim(),
          subdomain: input.subdomain.toLowerCase().trim(),
          slug: input.subdomain.toLowerCase().trim(),
          plan: 'trial',
          status: 'active',
          subscriptionTier: 'trial',
          licensedModules: selectedModules,
          signupModuleMode: planType,
          trialStartAt: now,
          trialEndsAt,
          billingStatus: 'trialing',
          onboardingCompleted: false,
        },
      })

      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase().trim(),
          password: passwordHash,
          name: input.name.trim(),
          role: 'owner',
          tenantId: tenant.id,
        },
      })

      if (selectedModules.length > 0) {
        await tx.moduleLicense.createMany({
          data: selectedModules.map((moduleId) => ({
            tenantId: tenant.id,
            moduleId,
            isActive: true,
            activatedAt: now,
            expiresAt: trialEndsAt,
          })),
          skipDuplicates: true,
        })
      }

      return { tenant, user }
    })

    const token = signToken({
      sub: created.user.id,
      userId: created.user.id,
      email: created.user.email,
      role: created.user.role || 'owner',
      roles: [created.user.role || 'owner'],
      permissions: ['*'],
      tenantId: created.tenant.id,
      tenant_id: created.tenant.id,
      tenant_slug: created.tenant.subdomain || undefined,
      modules: selectedModules,
      licensedModules: selectedModules,
      subscriptionTier: 'trial',
      trialStartAt: now.toISOString(),
      trialEndsAt: trialEndsAt.toISOString(),
      billingStatus: 'trialing',
    })

    const refreshToken = signRefreshToken({
      sub: created.user.id,
      tenant_id: created.tenant.id,
      type: 'refresh',
    })

    return NextResponse.json({
      user: {
        id: created.user.id,
        email: created.user.email,
        name: created.user.name,
        role: created.user.role || 'owner',
        roles: [created.user.role || 'owner'],
        avatar: created.user.avatar,
      },
      tenant: {
        id: created.tenant.id,
        name: created.tenant.name,
        subdomain: created.tenant.subdomain,
        plan: created.tenant.plan,
        licensedModules: selectedModules,
        subscriptionTier: 'trial',
        trialStartAt: now,
        trialEndsAt,
        billingStatus: 'trialing',
      },
      token,
      refreshToken,
      modules: selectedModules,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
