import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const massTransferSchema = z.object({
  leadIds: z.array(z.string()).min(1, 'At least one lead must be selected'),
  assignToUserId: z.string().min(1, 'User ID is required'),
})

// POST /api/crm/leads/mass-transfer - Mass transfer leads to a user
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = massTransferSchema.parse(body)

    // Verify the target user exists and belongs to the same tenant
    const targetUser = await prismaWithRetry(() =>
      prisma.user.findFirst({
        where: {
          id: validated.assignToUserId,
          tenantId,
        },
      })
    )

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found or does not belong to this tenant' },
        { status: 404 }
      )
    }

    // Find the SalesRep record for this user (Contact.assignedToId references SalesRep, not User)
    const salesRep = await prismaWithRetry(() =>
      prisma.salesRep.findFirst({
        where: {
          userId: validated.assignToUserId,
          tenantId,
        },
      })
    )

    if (!salesRep) {
      return NextResponse.json(
        { error: 'Target user does not have a SalesRep record. Please ensure the user is set up as a sales representative.' },
        { status: 400 }
      )
    }

    // Verify all leads (contacts) belong to this tenant
    const leads = await prismaWithRetry(() =>
      prisma.contact.findMany({
        where: {
          id: { in: validated.leadIds },
          tenantId,
        },
      })
    )

    if (leads.length !== validated.leadIds.length) {
      return NextResponse.json(
        { error: 'Some leads were not found or do not belong to this tenant' },
        { status: 400 }
      )
    }

    // Update all leads to assign them to the target SalesRep
    const result = await prismaWithRetry(() =>
      prisma.contact.updateMany({
        where: {
          id: { in: validated.leadIds },
          tenantId,
        },
        data: {
          assignedToId: salesRep.id, // Use SalesRep ID, not User ID
        },
      })
    )

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${result.count} lead(s) to ${targetUser.name || targetUser.email}`,
      transferred: result.count,
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

    console.error('Mass transfer leads error:', error)
    return NextResponse.json(
      { error: 'Failed to transfer leads', message: error?.message },
      { status: 500 }
    )
  }
}
