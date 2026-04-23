import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'

const businessProfileSchema = z.object({
  productsServices: z.string().max(4000).optional(),
  targetCustomers: z.string().max(2000).optional(),
  cityRegion: z.string().max(500).optional(),
  brandTone: z.string().max(500).optional(),
  coreOfferings: z.string().max(2000).optional(),
  whatsappNumber: z.string().max(50).optional(),
})

const updateTenantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  gstin: z.string().max(15).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(10).optional(),
  country: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().or(z.literal('')).optional(),
  website: z.string().url().or(z.literal('')).optional(),
  logo: z.string().url().or(z.literal('')).optional(),
  industry: z.string().max(120).optional(),
  industrySubType: z.string().max(120).optional(),
  businessProfile: businessProfileSchema.optional(),
})

function sanitizeOptional(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function extractBusinessProfile(industrySettings: unknown): z.infer<typeof businessProfileSchema> {
  if (!industrySettings || typeof industrySettings !== 'object') {
    return {}
  }
  const maybeProfile = (industrySettings as Record<string, unknown>).businessProfile
  if (!maybeProfile || typeof maybeProfile !== 'object') {
    return {}
  }
  const parsed = businessProfileSchema.safeParse(maybeProfile)
  return parsed.success ? parsed.data : {}
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        plan: true,
        status: true,
        maxUsers: true,
        currentPeriodEnd: true,
        industry: true,
        industrySubType: true,
        gstin: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        phone: true,
        email: true,
        website: true,
        logo: true,
        industrySettings: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...tenant,
      businessProfile: extractBusinessProfile(tenant.industrySettings),
    })
  } catch (error) {
    console.error('Get tenant settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch tenant settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateTenantSchema.parse(body)

    const current = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        id: true,
        industrySettings: true,
      },
    })

    if (!current) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    const stringKeys: Array<keyof Omit<z.infer<typeof updateTenantSchema>, 'businessProfile'>> = [
      'name',
      'gstin',
      'address',
      'city',
      'state',
      'postalCode',
      'country',
      'phone',
      'email',
      'website',
      'logo',
      'industry',
      'industrySubType',
    ]

    for (const key of stringKeys) {
      const value = validated[key]
      if (value !== undefined) {
        updateData[key] = sanitizeOptional(value as string)
      }
    }

    if (validated.businessProfile) {
      const existingSettings =
        current.industrySettings && typeof current.industrySettings === 'object'
          ? (current.industrySettings as Record<string, unknown>)
          : {}
      const existingProfile = extractBusinessProfile(existingSettings)
      updateData.industrySettings = {
        ...existingSettings,
        businessProfile: {
          ...existingProfile,
          ...validated.businessProfile,
        },
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id: user.tenantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        plan: true,
        status: true,
        maxUsers: true,
        currentPeriodEnd: true,
        industry: true,
        industrySubType: true,
        gstin: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        phone: true,
        email: true,
        website: true,
        logo: true,
        industrySettings: true,
      },
    })

    return NextResponse.json({
      ...tenant,
      businessProfile: extractBusinessProfile(tenant.industrySettings),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Update tenant settings error:', error)
    return NextResponse.json({ error: 'Failed to update tenant settings' }, { status: 500 })
  }
}

