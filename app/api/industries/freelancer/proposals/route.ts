/**
 * Freelancer Proposals API Route
 * POST /api/industries/freelancer/proposals - Create proposal
 * GET /api/industries/freelancer/proposals - List proposals
 */

import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/types/base-modules'
import { CreateProposalSchema, Proposal } from '@/modules/freelancer/types'
import { formatINR } from '@/lib/currency'
import { z } from 'zod'

/**
 * Create proposal
 * POST /api/industries/freelancer/proposals
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateProposalSchema.parse(body)

    // Calculate total amount
    const totalAmount = validatedData.services.reduce(
      (sum, service) => sum + service.quantity * service.rate,
      0
    )

    // Calculate expiry date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + validatedData.validityDays)

    const proposal: Proposal = {
      id: `proposal-${Date.now()}`,
      organizationId: validatedData.organizationId,
      clientId: validatedData.clientId,
      title: validatedData.title,
      description: validatedData.description,
      services: validatedData.services.map((service) => ({
        service: service.service,
        quantity: service.quantity,
        rate: service.rate,
        total: service.quantity * service.rate,
      })),
      totalAmount,
      validityDays: validatedData.validityDays,
      status: 'draft',
      expiresAt,
      createdAt: new Date(),
    }

    const response: ApiResponse<Proposal> = {
      success: true,
      statusCode: 201,
      data: proposal,
      meta: {
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error in POST proposals route:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, statusCode: 400, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}

/**
 * List proposals
 * GET /api/industries/freelancer/proposals?organizationId=xxx&status=sent
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    const status = searchParams.get('status')

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 400,
          error: {
            code: 'MISSING_ORGANIZATION_ID',
            message: 'organizationId is required',
          },
        },
        { status: 400 }
      )
    }

    // Return empty array for now - would fetch from database
    const proposals: Proposal[] = []

    const response: ApiResponse<Proposal[]> = {
      success: true,
      statusCode: 200,
      data: proposals,
      meta: {
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET proposals route:', error)
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}
