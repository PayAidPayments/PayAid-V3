/**
 * Freelancer Service Portfolio API Route
 * POST /api/industries/freelancer/portfolio - Create portfolio item
 * GET /api/industries/freelancer/portfolio - List portfolio items
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandling } from '@/lib/api/route-wrapper'
import { ApiResponse } from '@/types/base-modules'
import { CreateServicePortfolioSchema, ServicePortfolio } from '@/modules/freelancer/types'
import { formatINR } from '@/lib/currency'

/**
 * Create portfolio item
 * POST /api/industries/freelancer/portfolio
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CreateServicePortfolioSchema.parse(body)

  // Calculate total for services
  const totalAmount = validatedData.services.reduce(
    (sum, service) => sum + service.quantity * service.rate,
    0
  )

  // Store portfolio in a custom table or use existing structure
  // For now, we'll use a generic approach
  const portfolio: ServicePortfolio = {
    id: `portfolio-${Date.now()}`,
    organizationId: validatedData.organizationId,
    title: validatedData.title,
    description: validatedData.description,
    category: validatedData.category,
    rate: validatedData.rate,
    rateType: validatedData.rateType,
    images: validatedData.images || [],
    createdAt: new Date(),
  }

  const response: ApiResponse<ServicePortfolio> = {
    success: true,
    statusCode: 201,
    data: portfolio,
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response, { status: 201 })
})

/**
 * List portfolio items
 * GET /api/industries/freelancer/portfolio?organizationId=xxx
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('organizationId')

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
  const portfolio: ServicePortfolio[] = []

  const response: ApiResponse<ServicePortfolio[]> = {
    success: true,
    statusCode: 200,
    data: portfolio,
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response)
})
