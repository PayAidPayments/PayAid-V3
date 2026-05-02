/**
 * Vertical Automation API
 * POST /api/crm/templates/automation - Create vertical-specific automations
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { createVerticalAutomations } from '@/lib/automation/vertical-automation'
import { z } from 'zod'

const automationSchema = z.object({
  industry: z.enum(['fintech', 'd2c', 'agencies']),
})

// POST /api/crm/templates/automation - Create vertical automations
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const { industry } = automationSchema.parse(body)

    const result = await createVerticalAutomations(tenantId, industry)

    return NextResponse.json({
      success: result.errors.length === 0,
      created: result.created,
      errors: result.errors,
      message: `Created ${result.created} automation workflows for ${industry}`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Create vertical automation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create automations',
      },
      { status: 500 }
    )
  }
}
