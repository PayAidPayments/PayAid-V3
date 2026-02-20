/**
 * Tax Calculation API Route
 * POST /api/tax/calculate - Calculate tax for invoice items
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { calculateTotalTax, InvoiceLineItem } from '@/lib/tax/calculator'
import { z } from 'zod'

const calculateTaxSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      quantity: z.number().min(0),
      unitPrice: z.number().min(0),
      taxRuleId: z.string().optional(),
      taxType: z.string().optional(),
      taxRate: z.number().optional(),
      isExempt: z.boolean().optional(),
    })
  ),
  customerId: z.string().optional(),
})

/** POST /api/tax/calculate - Calculate tax */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const body = await request.json()
    const validated = calculateTaxSchema.parse(body)

    // Get tax rules for tenant
    const taxRules = await prisma.taxRule.findMany({
      where: {
        tenantId,
        isActive: true,
      },
    })

    // Calculate tax
    const result = calculateTotalTax(
      validated.items as InvoiceLineItem[],
      taxRules.map((r) => ({
        id: r.id,
        name: r.name,
        taxType: r.taxType as any,
        rate: r.rate,
        isDefault: r.isDefault,
        appliesTo: r.appliesTo as any,
        productIds: r.productIds,
        customerIds: r.customerIds,
        isExempt: r.isExempt,
        exemptionReason: r.exemptionReason || undefined,
      })),
      validated.customerId
    )

    return NextResponse.json({
      success: true,
      totalTax: result.totalTax,
      taxBreakdown: result.taxBreakdown,
      taxByType: result.taxByType,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to calculate tax', message: error.message },
      { status: 500 }
    )
  }
}
