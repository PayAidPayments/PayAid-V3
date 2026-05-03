import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { getEncryptionService } from '@/lib/security/encryption'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

const createAccountSchema = z.object({
  provider: z.enum(['gmail', 'outlook', 'custom', 'payaid']).default('custom'),
  email: z.string().email(),
  displayName: z.string().optional(),
  imapHost: z.string().optional(),
  imapPort: z.number().int().positive().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().positive().optional(),
  password: z.string().optional(),
  providerCredentials: z.record(z.any()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const accounts = await prisma.emailAccount.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        displayName: true,
        provider: true,
        providerAccountId: true,
        imapHost: true,
        imapPort: true,
        smtpHost: true,
        smtpPort: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: { accounts },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('List email accounts failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to list email accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const input = createAccountSchema.parse(body)

    const encryption = getEncryptionService()
    const encryptedPassword = input.password
      ? encryption.encrypt(input.password)
      : encryption.encrypt(`oauth:${Date.now()}`)

    const providerCredentials = input.providerCredentials
      ? (Object.fromEntries(
          Object.entries(input.providerCredentials).map(([key, value]) => [
            key,
            typeof value === 'string' ? encryption.encrypt(value) : value,
          ])
        ) as Record<string, unknown>)
      : undefined

    const account = await prisma.emailAccount.create({
      data: {
        tenantId,
        userId,
        email: input.email,
        displayName: input.displayName,
        provider: input.provider,
        imapHost: input.imapHost,
        imapPort: input.imapPort ?? 993,
        smtpHost: input.smtpHost,
        smtpPort: input.smtpPort ?? 587,
        password: encryptedPassword,
        providerCredentials,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        provider: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: account,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Create email account failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to create email account' }, { status: 500 })
  }
}
