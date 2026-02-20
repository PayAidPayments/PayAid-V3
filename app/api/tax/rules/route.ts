/**
 * Tax Rules API Route
 * GET /api/tax/rules - List tax rules
 * POST /api/tax/rules - Create tax rule
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createTaxRuleSchema = z.object({
  name: z.string().min(1),
  taxType: z.enum(['GST', 'VAT', 'SALES_TAX', 'CUSTOM']),
  rate: z.number().min(0).max(100),
  isDefault: z.boolean().default(false),
  appliesTo: z.enum(['all', 'products', 'services', 'specific']).default('all'),
  productIds: z.array(z.string()).default([]),
  customerIds: z.array(z.string()).default([]),
  isExempt: z.boolean().default(false),
  exemptionReason: z.string().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
})

/** GET /api/tax/rules - List tax rules */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const searchParams = request.nextUrl.searchParams
    const isActive = searchParams.get('active') !== 'false'
    const taxType = searchParams.get('taxType')

    const where: any = { tenantId }
    if (isActive !== undefined) {
      where.isActive = isActive
    }
    if (taxType) {
      where.taxType = taxType
    }

    const rules = await prisma.taxRule.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({
      success: true,
      rules,
      count: rules.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to list tax rules', message: error.message },
      { status: 500 }
    )
  }
}

/** POST /api/tax/rules - Create tax rule */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const body = await request.json()
    const validated = createTaxRuleSchema.parse(body)

    // If setting as default, unset other defaults
    if (validated.isDefault) {
      await prisma.taxRule.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const rule = await prisma.taxRule.create({
      data: {
        tenantId,
        name: validated.name,
        taxType: validated.taxType,
        rate: validated.rate,
        isDefault: validated.isDefault,
        appliesTo: validated.appliesTo,
        productIds: validated.productIds,
        customerIds: validated.customerIds,
        isExempt: validated.isExempt,
        exemptionReason: validated.exemptionReason,
        effectiveFrom: validated.effectiveFrom
          ? new Date(validated.effectiveFrom)
          : new Date(),
        effectiveTo: validated.effectiveTo ? new Date(validated.effectiveTo) : null,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Tax rule created successfully',
        rule,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create tax rule', message: error.message },
      { status: 500 }
    )
  }
}
