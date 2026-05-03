import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const callSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  phone: z.string().min(1, 'Phone number is required'),
  skipRings: z.boolean().optional().default(false),
  voicemailDetection: z.boolean().optional().default(true),
})

// POST /api/crm/dialer/call - Initiate a power dialer call
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = callSchema.parse(body)

    // Verify contact belongs to tenant
    const contact = await prisma.contact.findFirst({
      where: {
        id: validated.contactId,
        tenantId,
      },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found or does not belong to this tenant' },
        { status: 404 }
      )
    }

    // Create call record
    const callRecord = await prisma.interaction.create({
      data: {
        contactId: validated.contactId,
        type: 'call',
        subject: `Call to ${contact.name}`,
        notes: `Power dialer call initiated via WebRTC`,
        createdByRepId: userId,
        createdAt: new Date(),
      },
    })

    // Use WebRTC for free browser-to-browser calling
    // This avoids Twilio/Exotel costs and works entirely in the browser
    // The frontend will handle WebRTC connection setup
    
    return NextResponse.json({
      success: true,
      callId: callRecord.id,
      status: 'initiated',
      webrtc: true,
      message: 'Call initiated via WebRTC. Frontend will establish peer connection.',
      signalingUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crm/dialer/webrtc/signaling`,
      note: 'Using free WebRTC for browser-to-browser calls. No telephony provider costs.',
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Dialer call error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate call', message: error?.message },
      { status: 500 }
    )
  }
}
