/**
 * CRM Contact Detail API Route
 * GET /api/crm/contacts/[id] - Get single contact
 * PATCH /api/crm/contacts/[id] - Update contact
 * DELETE /api/crm/contacts/[id] - Archive contact
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandling, successResponse } from '@/lib/api/route-wrapper'
import { ApiResponse, Contact } from '@/types/base-modules'
import { UpdateContactSchema } from '@/modules/shared/crm/types'

/**
 * Get single contact
 * GET /api/crm/contacts/[id]
 */
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const contact = await prisma.contact.findUnique({
    where: { id },
  })

  if (!contact) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 404,
        error: {
          code: 'CONTACT_NOT_FOUND',
          message: 'Contact not found',
        },
      },
      { status: 404 }
    )
  }

  const response: ApiResponse<Contact> = {
    success: true,
    statusCode: 200,
    data: contact as Contact,
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response)
})

/**
 * Update contact
 * PATCH /api/crm/contacts/[id]
 */
export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const validatedData = UpdateContactSchema.parse(body)

  const contact = await prisma.contact.update({
    where: { id },
    data: validatedData,
  })

  const response: ApiResponse<Contact> = {
    success: true,
    statusCode: 200,
    data: contact as Contact,
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response)
})

/**
 * Archive contact (soft delete)
 * DELETE /api/crm/contacts/[id]
 */
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const contact = await prisma.contact.update({
    where: { id },
    data: { status: 'archived' },
  })

  const response: ApiResponse<Contact> = {
    success: true,
    statusCode: 200,
    data: contact as Contact,
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response)
})
