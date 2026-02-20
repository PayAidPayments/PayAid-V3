/**
 * Tax Rule API Route
 * GET /api/tax/rules/[id] - Get tax rule
 * PATCH /api/tax/rules/[id] - Update tax rule
 * DELETE /api/tax/rules/[id] - Delete tax rule
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateTaxRuleSchema = z.object({
  name: z.string().min(1).optional(),
  taxType: z.enum(['GST', 'VAT', 'SALES_TAX', 'CUSTOM']).optional(),
  rate: z.number().min(0).max(100).optional(),
  isDefault: z.boolean().optional(),
  appliesTo: z.enum(['all', 'products', 'services', 'specific']).optional(),
  productIds: z.array(z.string()).optional(),
  customerIds: z.array(z.string()).optional(),
  isExempt: z.boolean().optional(),
  exemptionReason: z.string().optional(),
  isActive: z.boolean().optional(),
})

/** GET /api/tax/rules/[id] - Get tax rule */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const { id } = await params

    const rule = await prisma.taxRule.findFirst({
      where: { id, tenantId },
    })

    if (!rule) {
      return NextResponse.json({ error: 'Tax rule not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, rule })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get tax rule', message: error.message },
      { status: 500 }
    )
  }
}

/** PATCH /api/tax/rules/[id] - Update tax rule */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const { id } = await params
    const body = await request.json()
    const validated = updateTaxRuleSchema.parse(body)

    // If setting as default, unset other defaults
    if (validated.isDefault) {
      await prisma.taxRule.updateMany({
        where: { tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const rule = await prisma.taxRule.update({
      where: { id },
      data: validated,
    })

    return NextResponse.json({
      success: true,
      message: 'Tax rule updated successfully',
      rule,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update tax rule', message: error.message },
      { status: 500 }
    )
  }
}

/** DELETE /api/tax/rules/[id] - Delete tax rule */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const { id } = await params

    const rule = await prisma.taxRule.findFirst({
      where: { id, tenantId },
    })

    if (!rule) {
      return NextResponse.json({ error: 'Tax rule not found' }, { status: 404 })
    }

    if (rule.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default tax rule. Set another rule as default first.' },
        { status: 400 }
      )
    }

    await prisma.taxRule.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Tax rule deleted successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete tax rule', message: error.message },
      { status: 500 }
    )
  }
}
