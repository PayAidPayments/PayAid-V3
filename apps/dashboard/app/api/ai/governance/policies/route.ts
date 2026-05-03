/**
 * AI Governance Policies API
 * Manage AI usage policies and permissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createPolicySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  rules: z.record(z.unknown()),
  isActive: z.boolean().default(true),
})

/** GET /api/ai/governance/policies - List AI governance policies */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    
    // For now, return default policies structure
    // In future, store in database
    const policies = [
      {
        id: 'default',
        name: 'Default AI Policy',
        description: 'Standard AI usage policy',
        rules: {
          allowDataTraining: false,
          requireHumanApproval: ['create_deal', 'create_invoice'],
          piiMasking: true,
          retentionDays: 90,
        },
        isActive: true,
      },
    ]

    return NextResponse.json({ policies })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to get policies' },
      { status: 500 }
    )
  }
}

/** POST /api/ai/governance/policies - Create AI governance policy */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = createPolicySchema.parse(body)

    // In future, store in database
    // For now, return success
    return NextResponse.json({
      policy: {
        id: `policy_${Date.now()}`,
        ...validated,
        tenantId,
        createdAt: new Date(),
      },
    }, { status: 201 })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: e.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create policy' },
      { status: 500 }
    )
  }
}
