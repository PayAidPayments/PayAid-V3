import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { updateRecordingConsent } from '@/lib/telephony/call-recording'
import { z } from 'zod'

const ConsentSchema = z.object({
  consent: z.boolean(),
})

/**
 * PUT /api/crm/contacts/[id]/recording-consent
 * Update call recording consent for a contact
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { consent } = ConsentSchema.parse(body)

    await updateRecordingConsent(id, consent, tenantId)

    return NextResponse.json({
      success: true,
      message: `Recording consent ${consent ? 'granted' : 'revoked'}`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error updating recording consent:', error)
    return NextResponse.json(
      { error: 'Failed to update recording consent' },
      { status: 500 }
    )
  }
}
