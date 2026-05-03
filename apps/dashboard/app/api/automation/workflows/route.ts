/**
 * Workflow Automation API
 * CRUD operations for sales automation workflows
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const workflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  triggerType: z.enum(['EVENT', 'SCHEDULE', 'MANUAL']),
  triggerEvent: z.string().optional(),
  triggerSchedule: z.string().optional(),
  steps: z.array(z.any()),
  isActive: z.boolean().optional().default(true),
})

// GET /api/automation/workflows - List workflows
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const workflows = await prisma.workflow.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, workflows })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get workflows error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get workflows' },
      { status: 500 }
    )
  }
}

// POST /api/automation/workflows - Create workflow
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = workflowSchema.parse(body)

    const workflow = await prisma.workflow.create({
      data: {
        tenantId,
        name: validated.name,
        description: validated.description,
        triggerType: validated.triggerType,
        triggerEvent: validated.triggerEvent,
        triggerSchedule: validated.triggerSchedule,
        steps: validated.steps as any,
        isActive: validated.isActive,
      },
    })

    return NextResponse.json({ success: true, workflow }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Create workflow error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create workflow' },
      { status: 500 }
    )
  }
}
