import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * PATCH /api/hr/biometric-devices/[id]
 * Update device (name, location, status, lastSyncAt)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id } = await params

    const existing = await prisma.biometricDevice.findFirst({
      where: { id, tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = String(body.name).trim()
    if (body.location !== undefined) data.location = body.location == null ? null : String(body.location).trim()
    if (body.deviceId !== undefined) data.deviceId = body.deviceId == null ? null : String(body.deviceId).trim()
    if (body.status !== undefined && ['ACTIVE', 'INACTIVE', 'ERROR'].includes(body.status)) data.status = body.status
    if (body.lastSyncAt !== undefined) data.lastSyncAt = body.lastSyncAt ? new Date(body.lastSyncAt) : null
    if (body.lastRecordCount !== undefined) data.lastRecordCount = body.lastRecordCount == null ? null : Number(body.lastRecordCount)
    if (body.config !== undefined && typeof body.config === 'object') data.config = body.config

    const device = await prisma.biometricDevice.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      id: device.id,
      name: device.name,
      deviceType: device.deviceType,
      location: device.location,
      deviceId: device.deviceId,
      status: device.status,
      lastSyncAt: device.lastSyncAt?.toISOString() ?? null,
      lastRecordCount: device.lastRecordCount,
      updatedAt: device.updatedAt.toISOString(),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

/**
 * DELETE /api/hr/biometric-devices/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id } = await params

    const existing = await prisma.biometricDevice.findFirst({
      where: { id, tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    await prisma.biometricDevice.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
