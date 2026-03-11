import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

type Params = Promise<{ id: string }>

/**
 * GET /api/hr/reports/builder/[id]
 * Get a single custom report configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id } = await params

    const report = await prisma.customReport.findFirst({
      where: { id, tenantId },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

/**
 * PATCH /api/hr/reports/builder/[id]
 * Update report (name, description, schedule, recipients)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id } = await params

    const existing = await prisma.customReport.findFirst({
      where: { id, tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = String(body.name)
    if (body.description !== undefined) data.description = body.description == null ? null : String(body.description)
    if (body.scheduleEnabled !== undefined) data.scheduleEnabled = Boolean(body.scheduleEnabled)
    if (body.scheduleFrequency !== undefined) data.scheduleFrequency = body.scheduleFrequency == null ? null : String(body.scheduleFrequency)
    if (body.scheduleDay !== undefined) data.scheduleDay = body.scheduleDay == null ? null : Number(body.scheduleDay)
    if (body.scheduleTime !== undefined) data.scheduleTime = body.scheduleTime == null ? null : String(body.scheduleTime)
    if (body.recipients !== undefined) data.recipients = Array.isArray(body.recipients) ? body.recipients : null
    if (body.exportFormats !== undefined) data.exportFormats = Array.isArray(body.exportFormats) ? body.exportFormats : null

    const report = await prisma.customReport.update({
      where: { id },
      data,
    })

    return NextResponse.json(report)
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
