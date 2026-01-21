/**
 * CRM Contacts API - Base Module
 * Handles contact CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandling, successResponse } from '@/lib/api/route-wrapper'
import { ApiResponse, Contact } from '@/types/base-modules'
import { CreateContactRequest, UpdateContactRequest, ContactListFilters, ContactListResponse } from '../types'
import { z } from 'zod'

// Validation schemas
const CreateContactSchema = z.object({
  organizationId: z.string().uuid(),
  industryModule: z.string(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  contactType: z.enum(['lead', 'customer', 'supplier', 'prospect']),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
})

const UpdateContactSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  contactType: z.enum(['lead', 'customer', 'supplier', 'prospect']).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
})

/**
 * Create a new contact
 * POST /api/crm/contacts
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CreateContactSchema.parse(body)

  const contact = await prisma.contact.create({
    data: {
      organizationId: validatedData.organizationId,
      industryModule: validatedData.industryModule,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      contactType: validatedData.contactType,
      status: 'active',
      tags: validatedData.tags || [],
      customFields: validatedData.customFields || {},
      notes: validatedData.notes || '',
      communicationHistory: [],
      transactionHistory: [],
      attachments: [],
    },
  })

  const response: ApiResponse<Contact> = {
    success: true,
    statusCode: 201,
    data: contact as Contact,
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response, { status: 201 })
})

/**
 * Get contacts list with filters
 * GET /api/crm/contacts?organizationId=xxx&contactType=customer&page=1&pageSize=20
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('organizationId')
  
  if (!organizationId) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 400,
        error: {
          code: 'MISSING_ORGANIZATION_ID',
          message: 'organizationId is required',
        },
      },
      { status: 400 }
    )
  }

  const filters: ContactListFilters = {
    organizationId,
    contactType: searchParams.get('contactType') as ContactListFilters['contactType'] || undefined,
    status: searchParams.get('status') as ContactListFilters['status'] || undefined,
    tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
    search: searchParams.get('search') || undefined,
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || '20', 10),
  }

  const where: Record<string, unknown> = {
    organizationId: filters.organizationId,
  }

  if (filters.contactType) {
    where.contactType = filters.contactType
  }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.tags && filters.tags.length > 0) {
    where.tags = {
      hasSome: filters.tags,
    }
  }

  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      skip: (filters.page! - 1) * filters.pageSize!,
      take: filters.pageSize!,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contact.count({ where }),
  ])

  const response: ApiResponse<ContactListResponse> = {
    success: true,
    statusCode: 200,
    data: {
      contacts: contacts as Contact[],
      total,
      page: filters.page!,
      pageSize: filters.pageSize!,
    },
    meta: {
      pagination: {
        page: filters.page!,
        pageSize: filters.pageSize!,
        total,
      },
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response)
})
