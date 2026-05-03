import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { processMeetingIntelligence } from '@/lib/ai/meeting-intelligence'
import { prisma } from '@/lib/db/prisma'

/**
 * POST /api/crm/interactions/[id]/meeting-intelligence
 * Process meeting intelligence for an interaction (sentiment, summary, insights)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // Get interaction
    const interaction = await prisma.interaction.findFirst({
      where: { 
        id: params.id,
        contact: {
          tenantId,
        },
      },
    })

    if (!interaction) {
      return NextResponse.json(
        { error: 'Interaction not found' },
        { status: 404 }
      )
    }

    // Get transcript from notes
    const transcript = interaction.notes || ''
    const fullTranscript = transcript

    if (!fullTranscript || fullTranscript.trim().length === 0) {
      return NextResponse.json(
        { error: 'No transcript available for this interaction' },
        { status: 400 }
      )
    }

    // Process meeting intelligence
    const result = await processMeetingIntelligence(
      params.id,
      fullTranscript,
      tenantId
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error processing meeting intelligence:', error)
    return NextResponse.json(
      { error: 'Failed to process meeting intelligence' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/crm/interactions/[id]/meeting-intelligence
 * Get meeting intelligence for an interaction
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const interaction = await prisma.interaction.findFirst({
      where: { 
        id: params.id,
        contact: {
          tenantId,
        },
      },
      select: { notes: true },
    })

    if (!interaction) {
      return NextResponse.json(
        { error: 'Interaction not found' },
        { status: 404 }
      )
    }

    // Interaction model doesn't have metadata field
    // Meeting intelligence would need to be stored elsewhere or generated on-the-fly
    const intelligence = null

    return NextResponse.json({
      success: true,
      data: intelligence,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error fetching meeting intelligence:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meeting intelligence' },
      { status: 500 }
    )
  }
}
