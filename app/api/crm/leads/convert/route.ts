import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const convertLeadSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  createAccount: z.boolean().default(true),
  accountName: z.string().optional(),
  accountOwnerId: z.string().optional(),
  notifyAccountOwner: z.boolean().default(false),
  createContact: z.boolean().default(true),
  contactName: z.string().optional(),
  contactOwnerId: z.string().optional(),
  notifyContactOwner: z.boolean().default(false),
  createDeal: z.boolean().default(false),
  dealName: z.string().optional(),
  dealValue: z.number().optional(),
  dealOwnerId: z.string().optional(),
})

// POST /api/crm/leads/convert - Convert a lead to Account, Contact, and optionally Deal
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const user = await authenticateRequest(request)

    if (!user?.userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = convertLeadSchema.parse(body)

    // Fetch the lead
    const lead = await prisma.contact.findFirst({
      where: {
        id: validated.leadId,
        tenantId,
        type: 'lead',
      },
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Use transaction to ensure all-or-nothing conversion
    const result = await prisma.$transaction(async (tx) => {
      const createdRecords: any = {
        account: null,
        contact: null,
        deal: null,
      }

      // Determine owners (use provided or default to lead's owner or current user)
      const accountOwnerId = validated.accountOwnerId || lead.assignedToId || user.userId
      const contactOwnerId = validated.contactOwnerId || lead.assignedToId || user.userId
      const dealOwnerId = validated.dealOwnerId || lead.assignedToId || user.userId

      // Get SalesRep IDs for owners (deals require SalesRep, not User)
      const accountSalesRep = accountOwnerId
        ? await tx.salesRep.findFirst({
            where: { userId: accountOwnerId, tenantId },
          })
        : null
      const contactSalesRep = contactOwnerId
        ? await tx.salesRep.findFirst({
            where: { userId: contactOwnerId, tenantId },
          })
        : null
      const dealSalesRep = dealOwnerId
        ? await tx.salesRep.findFirst({
            where: { userId: dealOwnerId, tenantId },
          })
        : null

      // Create Account (Contact with type="account")
      if (validated.createAccount) {
        const accountName = validated.accountName || lead.company || lead.name
        createdRecords.account = await tx.contact.create({
          data: {
            tenantId,
            name: accountName,
            type: 'account',
            status: 'active',
            email: lead.email,
            phone: lead.phone,
            company: accountName,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            postalCode: lead.postalCode,
            country: lead.country || 'India',
            gstin: lead.gstin,
            source: lead.source,
            sourceId: lead.sourceId,
            assignedToId: accountSalesRep?.id || null,
            notes: `Converted from lead: ${lead.name}`,
            tags: lead.tags,
          },
        })

        // Notify account owner if requested
        if (validated.notifyAccountOwner && accountOwnerId) {
          await tx.activity.create({
            data: {
              tenantId,
              userId: accountOwnerId,
              type: 'account_assigned',
              entityType: 'contact',
              entityId: createdRecords.account.id,
              description: `You have been assigned as owner of account: ${accountName}`,
            },
          })
        }
      }

      // Create Contact (person contact)
      if (validated.createContact) {
        const contactName = validated.contactName || lead.name
        createdRecords.contact = await tx.contact.create({
          data: {
            tenantId,
            name: contactName,
            type: 'customer', // or 'contact' depending on your system
            status: 'active',
            email: lead.email,
            phone: lead.phone,
            company: validated.createAccount && createdRecords.account
              ? createdRecords.account.name
              : lead.company,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            postalCode: lead.postalCode,
            country: lead.country || 'India',
            gstin: lead.gstin,
            source: lead.source,
            sourceId: lead.sourceId,
            assignedToId: contactSalesRep?.id || null,
            notes: `Converted from lead: ${lead.name}`,
            tags: lead.tags,
          },
        })

        // Notify contact owner if requested
        if (validated.notifyContactOwner && contactOwnerId) {
          await tx.activity.create({
            data: {
              tenantId,
              userId: contactOwnerId,
              type: 'contact_assigned',
              entityType: 'contact',
              entityId: createdRecords.contact.id,
              description: `You have been assigned as owner of contact: ${contactName}`,
            },
          })
        }
      }

      // Create Deal (optional)
      if (validated.createDeal && createdRecords.contact) {
        const dealName = validated.dealName || `Deal for ${createdRecords.contact.name}`
        createdRecords.deal = await tx.deal.create({
          data: {
            tenantId,
            name: dealName,
            value: validated.dealValue || 0,
            probability: 50,
            stage: 'lead',
            contactId: createdRecords.contact.id,
            assignedToId: dealSalesRep?.id || null,
            expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
        })
      }

      // Update lead status to "converted"
      await tx.contact.update({
        where: { id: lead.id },
        data: {
          status: 'converted',
          notes: lead.notes
            ? `${lead.notes}\n\nConverted on ${new Date().toISOString()}. Created: ${[
                createdRecords.account ? 'Account' : null,
                createdRecords.contact ? 'Contact' : null,
                createdRecords.deal ? 'Deal' : null,
              ]
                .filter(Boolean)
                .join(', ')}`
            : `Converted on ${new Date().toISOString()}. Created: ${[
                createdRecords.account ? 'Account' : null,
                createdRecords.contact ? 'Contact' : null,
                createdRecords.deal ? 'Deal' : null,
              ]
                .filter(Boolean)
                .join(', ')}`,
        },
      })

      return createdRecords
    })

    return NextResponse.json({
      success: true,
      message: 'Lead converted successfully',
      created: result,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Convert lead error:', error)
    return NextResponse.json(
      { error: 'Failed to convert lead', message: error?.message },
      { status: 500 }
    )
  }
}

