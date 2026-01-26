/**
 * Account Decision Tree API
 * GET /api/accounts/[id]/decision-tree - Get decision tree
 * PUT /api/accounts/[id]/decision-tree - Update decision tree
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { DecisionTreeService } from '@/lib/accounts/decision-tree'
import { z } from 'zod'

const updateDecisionTreeSchema = z.object({
  decisionMakers: z.array(
    z.object({
      contactId: z.string(),
      name: z.string(),
      role: z.string(),
      influence: z.number().min(0).max(100),
      relationship: z.enum(['champion', 'influencer', 'decision_maker', 'blocker', 'end_user']),
      notes: z.string().optional(),
    })
  ),
})

// GET /api/accounts/[id]/decision-tree - Get decision tree
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const tree = await DecisionTreeService.getDecisionTree(tenantId, params.id)

    return NextResponse.json({
      success: true,
      data: tree,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get decision tree error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get decision tree' },
      { status: 500 }
    )
  }
}

// PUT /api/accounts/[id]/decision-tree - Update decision tree
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = updateDecisionTreeSchema.parse(body)

    const account = await DecisionTreeService.updateDecisionTree(
      tenantId,
      params.id,
      validated.decisionMakers
    )

    return NextResponse.json({
      success: true,
      data: account,
    })
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

    console.error('Update decision tree error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update decision tree' },
      { status: 500 }
    )
  }
}
