import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/crm/cpq/quotes - Get all quotes
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // For now, return empty array - in production, create Quote model
    const quotes = []

    return NextResponse.json({ quotes })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get quotes error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotes', message: error?.message },
      { status: 500 }
    )
  }
}
