import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const massDeleteSchema = z.object({
  leadIds: z.array(z.string()).min(1, 'At least one lead must be selected'),
})

// POST /api/crm/leads/mass-delete - Mass delete leads
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = massDeleteSchema.parse(body)

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

    // Delete all leads
    const result = await prisma.contact.deleteMany({
      where: {
        id: { in: validated.leadIds },
        tenantId,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.count} lead(s)`,
      deleted: result.count,
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

    console.error('Mass delete leads error:', error)
    return NextResponse.json(
      { error: 'Failed to delete leads', message: error?.message },
      { status: 500 }
    )
  }
}
