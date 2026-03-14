import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateRoleSchema = z.object({
  roleName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  roleType: z.enum(['admin', 'manager', 'user', 'custom']).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

/**
 * PATCH /api/settings/roles/[id] - Update role (custom only; system roles limited)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const role = await prisma.role.findFirst({
      where: { id, tenantId: user.tenantId },
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = updateRoleSchema.parse(body)

    const data: Record<string, unknown> = {}
    if (parsed.roleName !== undefined) data.roleName = parsed.roleName.trim()
    if (parsed.description !== undefined) data.description = parsed.description?.trim() ?? null
    if (parsed.roleType !== undefined) data.roleType = parsed.roleType
    if (parsed.permissions !== undefined) data.permissions = parsed.permissions
    if (parsed.isActive !== undefined) data.isActive = parsed.isActive

    const updated = await prisma.role.update({
      where: { id },
      data,
    })

    return NextResponse.json({ role: updated })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    console.error('PATCH settings/roles/[id]:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to update role' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/settings/roles/[id] - Deactivate or delete custom role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const role = await prisma.role.findFirst({
      where: { id, tenantId: user.tenantId },
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    if (role.isSystem) {
      return NextResponse.json(
        { error: 'System roles cannot be deleted. Deactivate instead.' },
        { status: 400 }
      )
    }

    await prisma.role.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE settings/roles/[id]:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to delete role' },
      { status: 500 }
    )
  }
}
