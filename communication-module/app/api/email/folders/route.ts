import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@payaid/db'
import { z } from 'zod'

const createFolderSchema = z.object({
  accountId: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive', 'custom']).optional(),
})

// GET /api/email/folders - List folders for an account
export async function GET(request: NextRequest) {
  try {
    // Check CRM module license (email is part of customer communication/CRM)
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get('accountId')

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

    const folders = await prisma.emailFolder.findMany({
      where: {
        accountId,
        isHidden: false,
      },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ folders })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get email folders error:', error)
    return NextResponse.json(
      { error: 'Failed to get email folders' },
      { status: 500 }
    )
  }
}

// POST /api/email/folders - Create custom folder
export async function POST(request: NextRequest) {
  try {
    // Check CRM module license (email is part of customer communication/CRM)
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createFolderSchema.parse(body)

    // Verify account belongs to tenant
    const account = await prisma.emailAccount.findFirst({
      where: {
        id: validated.accountId,
        tenantId: tenantId,
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Email account not found' },
        { status: 404 }
      )
    }

    // Check if folder name already exists
    const existing = await prisma.emailFolder.findFirst({
      where: {
        accountId: validated.accountId,
        name: validated.name,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Folder name already exists' },
        { status: 409 }
      )
    }

    // Create folder
    const folder = await prisma.emailFolder.create({
      data: {
        accountId: validated.accountId,
        name: validated.name,
        type: validated.type || 'custom',
        displayOrder: 100, // Custom folders after default ones
      },
    })

    return NextResponse.json(folder, { status: 201 })
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

    console.error('Create email folder error:', error)
    return NextResponse.json(
      { error: 'Failed to create email folder' },
      { status: 500 }
    )
  }
}
