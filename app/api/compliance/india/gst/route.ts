import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getGSTCompliance, recordGSTFiling } from '@/lib/compliance/india-compliance'
import { z } from 'zod'

const filingSchema = z.object({
  period: z.string(),
  gstr1Filed: z.boolean(),
  gstr3bFiled: z.boolean(),
  taxPaid: z.number(),
  filingDate: z.string().datetime(),
})

/**
 * GET /api/compliance/india/gst
 * Get GST compliance status
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'compliance')

    const compliance = await getGSTCompliance(tenantId)

    if (!compliance) {
      return NextResponse.json(
        { error: 'GSTIN not configured for this tenant' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      compliance,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('GST compliance error:', error)
    return NextResponse.json(
      { error: 'Failed to get GST compliance', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/compliance/india/gst
 * Record GST filing
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'compliance')

    const body = await request.json()
    const validated = filingSchema.parse(body)

    await recordGSTFiling(tenantId, {
      ...validated,
      filingDate: new Date(validated.filingDate),
      filedBy: userId,
    })

    return NextResponse.json({
      success: true,
      message: 'GST filing recorded successfully',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('GST filing error:', error)
    return NextResponse.json(
      { error: 'Failed to record GST filing', details: String(error) },
      { status: 500 }
    )
  }
}
