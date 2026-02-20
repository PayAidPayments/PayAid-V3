import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/contractors/[id]
 * Get contractor details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const contractor = await prisma.contractor.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        department: true,
      },
    })

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    return NextResponse.json(contractor)
  } catch (error: any) {
    return handleLicenseError(error)
  }
}

/**
 * PATCH /api/hr/contractors/[id]
 * Update contractor
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      startDate,
      endDate,
      monthlyRate,
      tdsApplicable,
      tdsRate,
      panNumber,
      departmentId,
      project,
      address,
      city,
      state,
      pincode,
      status,
    } = body

    const contractor = await prisma.contractor.updateMany({
      where: {
        id: params.id,
        tenantId,
      },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(monthlyRate !== undefined && { monthlyRate }),
        ...(tdsApplicable !== undefined && { tdsApplicable }),
        ...(tdsRate !== undefined && { tdsRate }),
        ...(panNumber !== undefined && { panNumber }),
        ...(departmentId !== undefined && { departmentId }),
        ...(project !== undefined && { project }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(pincode !== undefined && { pincode }),
        ...(status && { status }),
      },
    })

    if (contractor.count === 0) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    const updated = await prisma.contractor.findFirst({
      where: { id: params.id, tenantId },
      include: { department: true },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
