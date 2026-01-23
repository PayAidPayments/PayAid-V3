/**
 * Freelancer Service Portfolio API Route
 * POST /api/industries/freelancer/portfolio - Create portfolio item
 * GET /api/industries/freelancer/portfolio - List portfolio items
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { ApiResponse } from '@/types/base-modules'
import { CreateServicePortfolioSchema, ServicePortfolio } from '@/modules/freelancer/types'
import { formatINR } from '@/lib/currency'
import { z } from 'zod'

/**
 * Create portfolio item
 * POST /api/industries/freelancer/portfolio
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateServicePortfolioSchema.parse(body)

    // Portfolio items don't have services array - they are individual items
    // The rate is already set in validatedData.rate

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
  } catch (error) {
    console.error('Error in POST portfolio route:', error)
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
 * List portfolio items
 * GET /api/industries/freelancer/portfolio?organizationId=xxx
 */
export async function GET(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error('Error in GET portfolio route:', error)
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}
