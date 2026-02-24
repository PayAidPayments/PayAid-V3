import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const bulkCompleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
})

// POST /api/tasks/bulk-complete - Mark multiple tasks as completed
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const { ids } = bulkCompleteSchema.parse(body)

    const result = await prisma.task.updateMany({
      where: {
        id: { in: ids },
        tenantId,
      },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      count: result.count,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Bulk complete error:', error)
    return NextResponse.json(
      { error: 'Failed to bulk complete tasks' },
      { status: 500 }
    )
  }
}
