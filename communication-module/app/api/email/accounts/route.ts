import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@payaid/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createEmailAccountSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().optional(),
  password: z.string().min(8),
  storageQuotaMB: z.number().optional(),
})

// GET /api/email/accounts - List all email accounts for tenant
export async function GET(request: NextRequest) {
  try {
    // Check CRM module license (email is part of customer communication/CRM)
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const accounts = await prisma.emailAccount.findMany({
      where: {
        tenantId: tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Don't return passwords
    const safeAccounts = accounts.map((account) => ({
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      userId: account.userId,
      user: account.user,
      storageQuotaMB: account.storageQuotaMB,
      storageUsedMB: account.storageUsedMB,
      isActive: account.isActive,
      isLocked: account.isLocked,
      provider: account.provider,
      lastLoginAt: account.lastLoginAt,
      createdAt: account.createdAt,
    }))

    return NextResponse.json({ accounts: safeAccounts })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get email accounts error:', error)
    return NextResponse.json(
      { error: 'Failed to get email accounts' },
      { status: 500 }
    )
  }
}

// POST /api/email/accounts - Create new email account
export async function POST(request: NextRequest) {
  try {
    // Check CRM module license (email is part of customer communication/CRM)
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createEmailAccountSchema.parse(body)

    // Verify user belongs to tenant
    const targetUser = await prisma.user.findFirst({
      where: {
        id: validated.userId,
        tenantId: tenantId,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found or does not belong to your tenant' },
        { status: 404 }
      )
    }

    // Check if email already exists
    const existing = await prisma.emailAccount.findFirst({
      where: {
        tenantId: tenantId,
        email: validated.email,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Email account already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 12)

    // Create email account
    const emailAccount = await prisma.emailAccount.create({
      data: {
        tenantId: tenantId,
        userId: validated.userId,
        email: validated.email,
        displayName: validated.displayName || targetUser.name || '',
        password: hashedPassword,
        storageQuotaMB: validated.storageQuotaMB || 25000, // 25GB default
        imapHost: process.env.EMAIL_IMAP_HOST || 'imap.payaid.io',
        smtpHost: process.env.EMAIL_SMTP_HOST || 'smtp.payaid.io',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create default folders
    const defaultFolders = [
      { name: 'Inbox', type: 'inbox', displayOrder: 1 },
      { name: 'Sent', type: 'sent', displayOrder: 2 },
      { name: 'Drafts', type: 'drafts', displayOrder: 3 },
      { name: 'Trash', type: 'trash', displayOrder: 4 },
      { name: 'Spam', type: 'spam', displayOrder: 5 },
      { name: 'Archive', type: 'archive', displayOrder: 6 },
    ]

    await Promise.all(
      defaultFolders.map((folder) =>
        prisma.emailFolder.create({
          data: {
            accountId: emailAccount.id,
            name: folder.name,
            type: folder.type,
            displayOrder: folder.displayOrder,
          },
        })
      )
    )

    // Don't return password
    const { password, ...safeAccount } = emailAccount

    return NextResponse.json(safeAccount, { status: 201 })
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

    console.error('Create email account error:', error)
    return NextResponse.json(
      { error: 'Failed to create email account' },
      { status: 500 }
    )
  }
}
