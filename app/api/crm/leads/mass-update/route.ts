import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const massUpdateSchema = z.object({
  leadIds: z.array(z.string()).min(1, 'At least one lead must be selected'),
  updates: z.object({
    status: z.string().optional(),
    source: z.string().optional(),
    sourceId: z.string().optional(),
    assignedToId: z.string().optional(),
    stage: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be updated',
  }),
})

// POST /api/crm/leads/mass-update - Mass update leads
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = massUpdateSchema.parse(body)

    // Verify all leads belong to this tenant
    const leads = await prisma.contact.findMany({
      where: {
        id: { in: validated.leadIds },
        tenantId,
      },
    })

    if (leads.length !== validated.leadIds.length) {
      return NextResponse.json(
        { error: 'Some leads were not found or do not belong to this tenant' },
        { status: 400 }
      )
    }

    // Build update data object (only include fields that are provided)
    const updateData: any = {}
    if (validated.updates.status !== undefined) updateData.status = validated.updates.status
    if (validated.updates.source !== undefined) updateData.source = validated.updates.source
    if (validated.updates.sourceId !== undefined) updateData.sourceId = validated.updates.sourceId
    if (validated.updates.assignedToId !== undefined) updateData.assignedToId = validated.updates.assignedToId
    if (validated.updates.stage !== undefined) updateData.stage = validated.updates.stage
    if (validated.updates.tags !== undefined) updateData.tags = validated.updates.tags

    // Update all leads
    const result = await prisma.contact.updateMany({
      where: {
        id: { in: validated.leadIds },
        tenantId,
      },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.count} lead(s)`,
      updated: result.count,
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

    console.error('Mass update leads error:', error)
    return NextResponse.json(
      { error: 'Failed to update leads', message: error?.message },
      { status: 500 }
    )
  }
}
