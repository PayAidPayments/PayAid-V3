/**
 * CRM Contact Detail API Route
 * GET /api/crm/contacts/[id] - Get single contact
 * PATCH /api/crm/contacts/[id] - Update contact
 * DELETE /api/crm/contacts/[id] - Archive contact
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { ApiResponse, Contact } from '@/types/base-modules'
import { z } from 'zod'

// Define schema locally to avoid import issues
const UpdateContactSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  contactType: z.enum(['lead', 'customer', 'supplier', 'prospect']).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
})

/**
 * Get single contact
 * GET /api/crm/contacts/[id]
 */
export async function GET(
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> }
) {
  try {
    const params = await (context?.params || Promise.resolve({}))
    const id = (params as Record<string, string>).id
    if (!id) {
      return NextResponse.json({ success: false, statusCode: 400, error: { code: 'MISSING_ID', message: 'ID is required' } }, { status: 400 })
    }

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

    // Map Prisma Contact to our Contact interface
    const mappedContact: Contact = {
      id: contact.id,
      organizationId: contact.tenantId,
      industryModule: 'freelancer' as const,
      firstName: contact.name.split(' ')[0] || contact.name,
      lastName: contact.name.split(' ').slice(1).join(' ') || '',
      email: contact.email || '',
      phone: contact.phone || '',
      contactType: (contact.type || 'lead') as Contact['contactType'],
      status: (contact.status || 'active') as Contact['status'],
      tags: [],
      customFields: {},
      communicationHistory: [],
      transactionHistory: [],
      notes: contact.notes || '',
      attachments: [],
      createdAt: contact.createdAt,
      updatedAt: contact.createdAt, // Contact model doesn't have updatedAt, use createdAt
    }

    const response: ApiResponse<Contact> = {
      success: true,
      statusCode: 200,
      data: mappedContact,
      meta: {
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET contact route:', error)
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}

/**
 * Update contact
 * PATCH /api/crm/contacts/[id]
 */
export async function PATCH(
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> }
) {
  try {
    const params = await (context?.params || Promise.resolve({}))
    const id = (params as Record<string, string>).id
    if (!id) {
      return NextResponse.json({ success: false, statusCode: 400, error: { code: 'MISSING_ID', message: 'ID is required' } }, { status: 400 })
    }
    const body = await request.json()
    const validatedData = UpdateContactSchema.parse(body)

    // Map validated data to Prisma Contact fields
    const updateData: Record<string, unknown> = {}
    if (validatedData.firstName !== undefined || validatedData.lastName !== undefined) {
      const currentContact = await prisma.contact.findUnique({ where: { id }, select: { name: true } })
      const firstName = validatedData.firstName || currentContact?.name.split(' ')[0] || ''
      const lastName = validatedData.lastName || currentContact?.name.split(' ').slice(1).join(' ') || ''
      updateData.name = `${firstName} ${lastName}`.trim()
    }
    if (validatedData.email !== undefined) updateData.email = validatedData.email
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone
    if (validatedData.contactType !== undefined) updateData.type = validatedData.contactType
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes

    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
    })

    // Map Prisma Contact to our Contact interface
    const mappedContact: Contact = {
      id: contact.id,
      organizationId: contact.tenantId,
      industryModule: 'freelancer' as const,
      firstName: contact.name.split(' ')[0] || contact.name,
      lastName: contact.name.split(' ').slice(1).join(' ') || '',
      email: contact.email || '',
      phone: contact.phone || '',
      contactType: (contact.type || 'lead') as Contact['contactType'],
      status: (contact.status || 'active') as Contact['status'],
      tags: [],
      customFields: {},
      communicationHistory: [],
      transactionHistory: [],
      notes: contact.notes || '',
      attachments: [],
      createdAt: contact.createdAt,
      updatedAt: contact.createdAt, // Contact model doesn't have updatedAt, use createdAt
    }

    const response: ApiResponse<Contact> = {
      success: true,
      statusCode: 200,
      data: mappedContact,
      meta: {
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in PATCH contact route:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, statusCode: 400, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}

/**
 * Archive contact (soft delete)
 * DELETE /api/crm/contacts/[id]
 */
export async function DELETE(
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> }
) {
  try {
    const params = await (context?.params || Promise.resolve({}))
    const id = (params as Record<string, string>).id
    if (!id) {
      return NextResponse.json({ success: false, statusCode: 400, error: { code: 'MISSING_ID', message: 'ID is required' } }, { status: 400 })
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: { status: 'archived' },
    })

    // Map Prisma Contact to our Contact interface
    const mappedContact: Contact = {
      id: contact.id,
      organizationId: contact.tenantId,
      industryModule: 'freelancer' as const,
      firstName: contact.name.split(' ')[0] || contact.name,
      lastName: contact.name.split(' ').slice(1).join(' ') || '',
      email: contact.email || '',
      phone: contact.phone || '',
      contactType: (contact.type || 'lead') as Contact['contactType'],
      status: (contact.status || 'active') as Contact['status'],
      tags: [],
      customFields: {},
      communicationHistory: [],
      transactionHistory: [],
      notes: contact.notes || '',
      attachments: [],
      createdAt: contact.createdAt,
      updatedAt: contact.createdAt, // Contact model doesn't have updatedAt, use createdAt
    }

    const response: ApiResponse<Contact> = {
      success: true,
      statusCode: 200,
      data: mappedContact,
      meta: {
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in DELETE contact route:', error)
    return NextResponse.json(
      { success: false, statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}
