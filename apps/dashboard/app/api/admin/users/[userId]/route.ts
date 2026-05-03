import { NextRequest, NextResponse } from 'next/server'
import { requireTenantAdmin } from '@/lib/middleware/requireTenantAdmin'
import { prisma } from '@/lib/db/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const decoded = await requireTenantAdmin()
    const tenantId = decoded.tenant_id ?? decoded.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    const { userId } = await params

    // Verify user belongs to tenant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    })

    if (!user || user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting yourself
    if (userId === decoded.userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ success: true, message: 'User removed successfully' })
  } catch (e) {
    console.error('Delete user error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const decoded = await requireTenantAdmin()
    const tenantId = decoded.tenant_id ?? decoded.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    const { userId } = await params
    const body = await request.json()
    const { name, role } = body

    // Verify user belongs to tenant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    })

    if (!user || user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updatedUser,
        createdAt: updatedUser.createdAt.toISOString(),
      },
    })
  } catch (e) {
    console.error('Update user error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
