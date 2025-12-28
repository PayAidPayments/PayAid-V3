import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const acceptOfferSchema = z.object({
  acceptedCtcInr: z.number().positive().optional(),
})

// PUT /api/hr/offers/[id]/accept - Accept an offer and create employee
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const validated = acceptOfferSchema.parse(body)

    const offer = await prisma.offer.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
      include: {
        candidate: true,
        requisition: true,
      },
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }

    if (offer.offerStatus !== 'SENT') {
      return NextResponse.json(
        { error: `Offer is already ${offer.offerStatus}` },
        { status: 400 }
      )
    }

    // Update offer status
    const acceptedCtc = validated.acceptedCtcInr
      ? new Decimal(validated.acceptedCtcInr.toString())
      : offer.offeredCtcInr

    const updatedOffer = await prisma.offer.update({
      where: { id: params.id },
      data: {
        offerStatus: 'ACCEPTED',
        acceptedCtcInr: acceptedCtc,
      },
    })

    // Create employee from candidate
    const employeeCount = await prisma.employee.count({
      where: { tenantId: tenantId },
    })
    const employeeCode = `EMP-${String(employeeCount + 1).padStart(4, '0')}`

    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        firstName: offer.candidate.fullName.split(' ')[0] || offer.candidate.fullName,
        lastName: offer.candidate.fullName.split(' ').slice(1).join(' ') || '',
        officialEmail: offer.candidate.email,
        mobileCountryCode: '+91',
        mobileNumber: offer.candidate.phone,
        joiningDate: offer.joiningDate || new Date(),
        status: 'PROBATION',
        departmentId: offer.requisition.departmentId || null,
        locationId: offer.requisition.locationId || null,
        ctcAnnualInr: acceptedCtc,
        tenantId: tenantId,
        createdBy: userId,
        updatedBy: userId,
      },
    })

    // Update offer with employee ID
    await prisma.offer.update({
      where: { id: params.id },
      data: {
        employeeId: employee.id,
      },
    })

    // Update candidate status
    await prisma.candidate.update({
      where: { id: offer.candidateId },
      data: {
        status: 'HIRED',
      },
    })

    return NextResponse.json({
      offer: updatedOffer,
      employee,
      message: 'Offer accepted and employee created successfully',
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Accept offer error:', error)
    return NextResponse.json(
      { error: 'Failed to accept offer' },
      { status: 500 }
    )
  }
}
