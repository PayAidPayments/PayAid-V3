import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

/** DELETE /api/admin/sandbox-tenant/[id] - Delete sandbox tenant */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    // Verify sandbox belongs to parent tenant (check industrySettings)
    const sandbox = await prisma.tenant.findFirst({
      where: {
        id,
        industrySettings: {
          path: ['isSandbox'],
          equals: true,
        },
      },
    })
    
    // Verify parent tenant match
    const sandboxSettings = sandbox?.industrySettings as any
    if (!sandbox || sandboxSettings?.parentTenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Sandbox not found or access denied' },
        { status: 404 }
      )
    }

    if (!sandbox) {
      return NextResponse.json(
        { error: 'Sandbox not found' },
        { status: 404 }
      )
    }

    // Delete sandbox tenant (cascade will handle related data)
    await prisma.tenant.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to delete sandbox' },
      { status: 500 }
    )
  }
}
