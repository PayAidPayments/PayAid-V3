import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createCurrencySchema = z.object({
  code: z.string().length(3), // ISO 4217
  name: z.string().min(1),
  symbol: z.string().min(1),
  exchangeRate: z.number().positive(),
  isBase: z.boolean().default(false),
  decimalPlaces: z.number().int().min(0).max(4).default(2),
})

// GET /api/currencies - List currencies
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const currencies = await prisma.currency.findMany({
      where: {
        OR: [
          { tenantId },
          { tenantId: null }, // Global currencies
        ],
        isActive: true,
      },
      orderBy: [
        { isBase: 'desc' },
        { code: 'asc' },
      ],
    })

    return NextResponse.json({ currencies })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get currencies error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch currencies' },
      { status: 500 }
    )
  }
}

// POST /api/currencies - Create currency
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createCurrencySchema.parse(body)

    // If setting as base, unset other base currencies
    if (validated.isBase) {
      await prisma.currency.updateMany({
        where: {
          tenantId,
          isBase: true,
        },
        data: {
          isBase: false,
        },
      })
    }

    // Check if code already exists for tenant
    const existing = await prisma.currency.findUnique({
      where: {
        tenantId_code: {
          tenantId: tenantId || '',
          code: validated.code,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Currency code already exists' },
        { status: 400 }
      )
    }

    const currency = await prisma.currency.create({
      data: {
        tenantId,
        code: validated.code,
        name: validated.name,
        symbol: validated.symbol,
        exchangeRate: new Decimal(validated.exchangeRate),
        isBase: validated.isBase,
        decimalPlaces: validated.decimalPlaces,
      },
    })

    return NextResponse.json({ currency }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create currency error:', error)
    return NextResponse.json(
      { error: 'Failed to create currency' },
      { status: 500 }
    )
  }
}

