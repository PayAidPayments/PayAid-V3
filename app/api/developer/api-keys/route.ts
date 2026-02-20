import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { generateAPIKey, revokeAPIKey } from '@/lib/security/api-keys'
import { z } from 'zod'

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).min(1),
  rateLimit: z.number().int().min(1).max(10000).optional(),
  ipWhitelist: z.array(z.string()).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional().default(90),
})

/** GET /api/developer/api-keys - List API keys for tenant */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        orgId: tenantId,
        expiresAt: { gt: new Date() }, // Only active keys
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { usageLogs: true },
        },
      },
    })

    const list = apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      scopes: key.scopes,
      rateLimit: key.rateLimit,
      ipWhitelist: key.ipWhitelist,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
      usageCount: key._count.usageLogs,
      // Never expose keyHash or actual key
    }))

    return NextResponse.json({ apiKeys: list })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    console.error('[API] developer/api-keys GET', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to list API keys' },
      { status: 500 }
    )
  }
}

/** POST /api/developer/api-keys - Create new API key */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = createApiKeySchema.parse(body)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + validated.expiresInDays)

    const result = await generateAPIKey({
      orgId: tenantId,
      name: validated.name,
      scopes: validated.scopes,
      rateLimit: validated.rateLimit,
      ipWhitelist: validated.ipWhitelist,
      expiresAt,
    })

    // Return key (show once only)
    return NextResponse.json({
      apiKey: {
        id: result.id,
        key: result.key, // ⚠️ Show once - user must save this
        name: result.name,
        createdAt: result.createdAt,
        expiresAt,
      },
      warning: 'Save this API key now. You will not be able to view it again.',
    }, { status: 201 })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: e.errors },
        { status: 400 }
      )
    }
    console.error('[API] developer/api-keys POST', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create API key' },
      { status: 500 }
    )
  }
}
