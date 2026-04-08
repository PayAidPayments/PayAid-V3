import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { updateRecordingConsent } from '@/lib/telephony/call-recording'
import { z } from 'zod'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'

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
  const { id } = await params
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()
    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:contact:recording_consent:${id}:${idempotencyKey}`)
      const existingUpdated = (existing?.afterSnapshot as { updated?: boolean } | null)?.updated
      if (existing && existingUpdated) {
        return NextResponse.json({ success: true, deduplicated: true }, { status: 200 })
      }
    }

    const body = await request.json()
    const { consent } = ConsentSchema.parse(body)

    await updateRecordingConsent(id, consent, tenantId)

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:contact:recording_consent:${id}:${idempotencyKey}`, {
        contact_id: id,
        consent,
        updated: true,
      })
    }

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
