import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const optOutSchema = z.object({
  phoneNumber: z.string().min(10),
  reason: z.enum(['user_request', 'spam', 'invalid', 'other']).optional(),
  source: z.enum(['webhook', 'manual', 'api']).default('api'),
})

// POST /api/sms/opt-out - Add phone number to opt-out list
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')

    const body = await request.json()
    const validated = optOutSchema.parse(body)

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = validated.phoneNumber.replace(/\D/g, '')

    const optOut = await prisma.sMSOptOut.upsert({
      where: {
        tenantId_phoneNumber: {
          tenantId,
          phoneNumber: normalizedPhone,
        },
      },
      update: {
        reason: validated.reason,
        source: validated.source,
        isSuppressed: true,
        suppressedAt: new Date(),
      },
      create: {
        tenantId,
        phoneNumber: normalizedPhone,
        reason: validated.reason,
        source: validated.source,
        isSuppressed: true,
        suppressedAt: new Date(),
      },
    })

    return NextResponse.json({ optOut }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create opt-out error:', error)
    return NextResponse.json(
      { error: 'Failed to create opt-out' },
      { status: 500 }
    )
  }
}

// GET /api/sms/opt-out - List opt-out numbers
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')

    const phoneNumber = request.nextUrl.searchParams.get('phoneNumber')
    const isSuppressed = request.nextUrl.searchParams.get('isSuppressed')

    const where: any = { tenantId }
    if (phoneNumber) {
      const normalized = phoneNumber.replace(/\D/g, '')
      where.phoneNumber = { contains: normalized }
    }
    if (isSuppressed !== null) {
      where.isSuppressed = isSuppressed === 'true'
    }

    const optOuts = await prisma.sMSOptOut.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ optOuts })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get opt-outs error:', error)
    return NextResponse.json(
      { error: 'Failed to get opt-outs' },
      { status: 500 }
    )
  }
}

