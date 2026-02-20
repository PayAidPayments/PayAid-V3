import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { revokeAPIKey } from '@/lib/security/api-keys'
import { z } from 'zod'

const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  scopes: z.array(z.string()).min(1).optional(),
  rateLimit: z.number().int().min(1).max(10000).optional(),
  ipWhitelist: z.array(z.string()).optional(),
})

/** GET /api/developer/api-keys/[id] - Get API key details */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    const apiKey = await prisma.apiKey.findFirst({
      where: { id, orgId: tenantId },
      include: {
        _count: {
          select: { usageLogs: true },
        },
      },
    })

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    return NextResponse.json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        scopes: apiKey.scopes,
        rateLimit: apiKey.rateLimit,
        ipWhitelist: apiKey.ipWhitelist,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
        usageCount: apiKey._count.usageLogs,
        isExpired: apiKey.expiresAt <= new Date(),
      },
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    console.error('[API] developer/api-keys/[id] GET', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to get API key' },
      { status: 500 }
    )
  }
}

/** PUT /api/developer/api-keys/[id] - Update API key */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params
    const body = await request.json()
    const validated = updateApiKeySchema.parse(body)

    const existing = await prisma.apiKey.findFirst({
      where: { id, orgId: tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    const update: Record<string, unknown> = {}
    if (validated.name !== undefined) update.name = validated.name
    if (validated.scopes !== undefined) update.scopes = validated.scopes
    if (validated.rateLimit !== undefined) update.rateLimit = validated.rateLimit
    if (validated.ipWhitelist !== undefined) update.ipWhitelist = validated.ipWhitelist

    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: update as any,
    })

    return NextResponse.json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        scopes: apiKey.scopes,
        rateLimit: apiKey.rateLimit,
        ipWhitelist: apiKey.ipWhitelist,
        expiresAt: apiKey.expiresAt,
      },
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: e.errors },
        { status: 400 }
      )
    }
    console.error('[API] developer/api-keys/[id] PUT', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to update API key' },
      { status: 500 }
    )
  }
}

/** DELETE /api/developer/api-keys/[id] - Revoke API key */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    const existing = await prisma.apiKey.findFirst({
      where: { id, orgId: tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    await revokeAPIKey(id, tenantId)

    return NextResponse.json({ success: true })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    console.error('[API] developer/api-keys/[id] DELETE', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to revoke API key' },
      { status: 500 }
    )
  }
}
