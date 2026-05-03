import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/biometric-devices
 * List biometric devices for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const devices = await prisma.biometricDevice.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(
      devices.map((d) => ({
        id: d.id,
        name: d.name,
        deviceType: d.deviceType,
        location: d.location,
        deviceId: d.deviceId,
        status: d.status,
        lastSyncAt: d.lastSyncAt?.toISOString() ?? null,
        lastRecordCount: d.lastRecordCount,
        createdAt: d.createdAt.toISOString(),
      }))
    )
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

/**
 * POST /api/hr/biometric-devices
 * Register a new biometric device
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const name = String(body.name || '').trim()
    const deviceType = ['FACIAL_RECOGNITION', 'FINGERPRINT', 'CARD'].includes(body.deviceType) ? body.deviceType : 'FACIAL_RECOGNITION'
    const location = body.location != null ? String(body.location).trim() : null
    const deviceId = body.deviceId != null ? String(body.deviceId).trim() : null
    const config = body.config && typeof body.config === 'object' ? body.config : null

    if (!name) {
      return NextResponse.json({ error: 'Device name is required' }, { status: 400 })
    }

    const device = await prisma.biometricDevice.create({
      data: {
        tenantId,
        name,
        deviceType,
        location,
        deviceId,
        config,
        status: 'ACTIVE',
      },
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
      createdAt: device.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
