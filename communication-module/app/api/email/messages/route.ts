import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@payaid/db'
import { z } from 'zod'

const sendEmailSchema = z.object({
  accountId: z.string().min(1),
  to: z.string().email().or(z.array(z.string().email())),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().min(1),
  body: z.string().optional(),
  htmlBody: z.string().optional(),
  replyTo: z.string().optional(),
})

// GET /api/email/messages - List messages for an account
export async function GET(request: NextRequest) {
  try {
    // Check CRM module license (email is part of customer communication/CRM)
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get('accountId')
    const folderId = searchParams.get('folderId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      )
    }

    // Verify account belongs to tenant
    const account = await prisma.emailAccount.findFirst({
      where: {
        id: accountId,
        tenantId: tenantId,
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Email account not found' },
        { status: 404 }
      )
    }

    const where: any = {
      accountId,
    }

    if (folderId) {
      where.folderId = folderId
    }

    const messages = await prisma.emailMessage.findMany({
      where,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
      },
      orderBy: { receivedAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    })

    const total = await prisma.emailMessage.count({ where })

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get email messages error:', error)
    return NextResponse.json(
      { error: 'Failed to get email messages' },
      { status: 500 }
    )
  }
}

// POST /api/email/messages/send - Send email
export async function POST(request: NextRequest) {
  try {
    // Check CRM module license (email is part of customer communication/CRM)
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = sendEmailSchema.parse(body)

    // Verify account belongs to tenant
    const account = await prisma.emailAccount.findFirst({
      where: {
        id: validated.accountId,
        tenantId: tenantId,
        isActive: true,
        isLocked: false,
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Email account not found or inactive' },
        { status: 404 }
      )
    }

    // Get or create Sent folder
    let sentFolder = await prisma.emailFolder.findFirst({
      where: {
        accountId: account.id,
        type: 'sent',
      },
    })

    if (!sentFolder) {
      sentFolder = await prisma.emailFolder.create({
        data: {
          accountId: account.id,
          name: 'Sent',
          type: 'sent',
          displayOrder: 2,
        },
      })
    }

    // Normalize recipients
    const toEmails = Array.isArray(validated.to) ? validated.to : [validated.to]
    const ccEmails = validated.cc || []
    const bccEmails = validated.bcc || []

    // Generate message ID
    const messageId = `<${Date.now()}-${Math.random().toString(36)}@payaid.io>`

    // Create message in Sent folder
    const message = await prisma.emailMessage.create({
      data: {
        accountId: account.id,
        folderId: sentFolder.id,
        messageId,
        fromEmail: account.email,
        fromName: account.displayName,
        toEmails,
        ccEmails,
        bccEmails,
        subject: validated.subject,
        body: validated.body || validated.htmlBody?.replace(/<[^>]*>/g, '') || '',
        htmlBody: validated.htmlBody,
        sentAt: new Date(),
        receivedAt: new Date(),
        isDraft: false,
        flags: [],
      },
      include: {
        folder: true,
        attachments: true,
      },
    })

    // TODO: In production, send via Postfix/SMTP server
    // For now, simulate sending
    // In production: await sendViaSMTP(message)

    // Update folder counts
    await prisma.emailFolder.update({
      where: { id: sentFolder.id },
      data: {
        totalCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({
      ...message,
      status: 'sent',
      message: 'Email sent successfully (simulated - SMTP integration pending)',
    }, { status: 201 })
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

    console.error('Send email error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
