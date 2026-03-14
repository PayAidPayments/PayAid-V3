import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateModuleSchema = z.object({
  isActive: z.boolean(),
})

// PATCH /api/modules/[id] - Toggle module on/off
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id: moduleId } = await params
    const body = await request.json()
    const validated = updateModuleSchema.parse(body)

    // Check if it's a base module (cannot be disabled)
    const BASE_MODULES = [
      'crm',
      'sales',
      'marketing',
      'finance',
      'hr',
      'communication',
      'ai-studio',
      'analytics',
      'invoicing',
      'accounting',
      'inventory',
      'productivity',
    ]

    if (BASE_MODULES.includes(moduleId) && !validated.isActive) {
      return NextResponse.json(
        { error: 'Base modules cannot be disabled' },
        { status: 400 }
      )
    }

    // Upsert module license
    const license = await prisma.moduleLicense.upsert({
      where: {
        tenantId_moduleId: {
          tenantId,
          moduleId,
        },
      },
      update: {
        isActive: validated.isActive,
      },
      create: {
        tenantId,
        moduleId,
        isActive: validated.isActive,
        activatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      license,
      message: validated.isActive ? 'Module enabled' : 'Module disabled',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Update module error:', error)
    return NextResponse.json(
      { error: 'Failed to update module' },
      { status: 500 }
    )
  }
}

