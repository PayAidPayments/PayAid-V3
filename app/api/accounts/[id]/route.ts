/**
 * Account API Route
 * GET /api/accounts/[id] - Get account
 * PUT /api/accounts/[id] - Update account
 * DELETE /api/accounts/[id] - Delete account
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { AccountHierarchyService } from '@/lib/accounts/account-hierarchy'
import { prisma } from '@/lib/db/prisma'

// GET /api/accounts/[id] - Get account
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const account = await AccountHierarchyService.getAccountWithHierarchy(tenantId, params.id)

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: account,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get account error:', error)
    return NextResponse.json(
      { error: 'Failed to get account' },
      { status: 500 }
    )
  }
}

// PUT /api/accounts/[id] - Update account
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()

    const account = await prisma.account.findFirst({
      where: { id: params.id, tenantId },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.account.update({
      where: { id: params.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.industry !== undefined && { industry: body.industry }),
        ...(body.annualRevenue !== undefined && { annualRevenue: body.annualRevenue }),
        ...(body.employeeCount !== undefined && { employeeCount: body.employeeCount }),
        ...(body.website !== undefined && { website: body.website }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.state !== undefined && { state: body.state }),
        ...(body.postalCode !== undefined && { postalCode: body.postalCode }),
        ...(body.country !== undefined && { country: body.country }),
        updatedAt: new Date(),
      },
      include: {
        parentAccount: true,
        childAccounts: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Update account error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update account' },
      { status: 500 }
    )
  }
}

// DELETE /api/accounts/[id] - Delete account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const account = await prisma.account.findFirst({
      where: { id: params.id, tenantId },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    await prisma.account.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete account' },
      { status: 500 }
    )
  }
}
