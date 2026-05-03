import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

// GET /api/task-templates - List templates for tenant
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const templates = await prisma.taskTemplate.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get task templates error:', error)
    return NextResponse.json(
      { error: 'Failed to get task templates' },
      { status: 500 }
    )
  }
}

const createTemplateSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  module: z.string().default('crm'),
  defaultDueDays: z.number().int().min(0).optional(),
})

// POST /api/task-templates - Create a template
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createTemplateSchema.parse(body)

    const template = await prisma.taskTemplate.create({
      data: {
        tenantId,
        name: validated.name,
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        module: validated.module,
        defaultDueDays: validated.defaultDueDays,
      },
    })

    return NextResponse.json(template, { status: 201 })
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
    console.error('Create task template error:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
