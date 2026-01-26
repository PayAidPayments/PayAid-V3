/**
 * Lead Routing API
 * POST /api/leads/route - Route lead to sales rep
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { LeadRouterService } from '@/lib/territories/lead-router'
import { z } from 'zod'

const routeLeadSchema = z.object({
  contactId: z.string().optional(),
  contactData: z.object({
    state: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    industry: z.string().optional(),
    company: z.string().optional(),
    annualRevenue: z.number().optional(),
  }).optional(),
  strategy: z.enum(['round-robin', 'weighted', 'capacity-based', 'territory-based']).default('territory-based'),
})

// POST /api/leads/route - Route lead
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = routeLeadSchema.parse(body)

    let salesRepId: string | null = null

    if (validated.contactId) {
      // Auto-assign existing contact
      salesRepId = await LeadRouterService.autoAssignContact(
        tenantId,
        validated.contactId,
        validated.strategy
      )
    } else if (validated.contactData) {
      // Route based on contact data
      salesRepId = await LeadRouterService.routeLead(
        tenantId,
        validated.contactData,
        validated.strategy
      )
    } else {
      return NextResponse.json(
        { error: 'Either contactId or contactData must be provided' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        salesRepId,
        routed: salesRepId !== null,
      },
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

    console.error('Route lead error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to route lead' },
      { status: 500 }
    )
  }
}
