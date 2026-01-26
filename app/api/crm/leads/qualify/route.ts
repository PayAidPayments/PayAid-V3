/**
 * Lead Qualification API
 * POST /api/crm/leads/qualify - Qualify a lead and determine next action
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { qualifyLead, batchQualifyLeads, QualificationConfig } from '@/lib/crm/lead-qualification'
import { z } from 'zod'

const qualifyRequestSchema = z.object({
  contactId: z.string().optional(),
  contactIds: z.array(z.string()).optional(),
  autoAssign: z.boolean().optional().default(false),
  config: z.object({
    mqlThreshold: z.number().optional(),
    sqlThreshold: z.number().optional(),
    pqlThreshold: z.number().optional(),
    autoRouteThreshold: z.number().optional(),
    nurtureThreshold: z.number().optional(),
    manualReviewMin: z.number().optional(),
    manualReviewMax: z.number().optional(),
  }).optional(),
})

// POST /api/crm/leads/qualify - Qualify lead(s)
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = qualifyRequestSchema.parse(body)

    if (validated.contactIds && validated.contactIds.length > 0) {
      // Batch qualification
      const results = await batchQualifyLeads(
        tenantId,
        validated.contactIds,
        validated.config,
        validated.autoAssign || false
      )

      return NextResponse.json({
        success: true,
        count: results.length,
        results,
        summary: {
          qualified: results.filter((r) => r.qualified).length,
          mql: results.filter((r) => r.qualificationLevel === 'MQL').length,
          sql: results.filter((r) => r.qualificationLevel === 'SQL').length,
          pql: results.filter((r) => r.qualificationLevel === 'PQL').length,
          autoRouted: results.filter((r) => r.action === 'auto-route').length,
          nurtured: results.filter((r) => r.action === 'nurture').length,
          manualReview: results.filter((r) => r.action === 'manual-review').length,
        },
      })
    } else if (validated.contactId) {
      // Single qualification
      const result = await qualifyLead(
        validated.contactId,
        tenantId,
        validated.config,
        validated.autoAssign || false
      )

      return NextResponse.json({
        success: true,
        result,
      })
    } else {
      return NextResponse.json(
        { error: 'Either contactId or contactIds required' },
        { status: 400 }
      )
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Lead qualification error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to qualify leads',
      },
      { status: 500 }
    )
  }
}
