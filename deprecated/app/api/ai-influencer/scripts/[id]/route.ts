import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const patchSchema = z.object({
  selectedVariation: z.number().int().min(0),
})

/**
 * PATCH /api/ai-influencer/scripts/[id]
 * Update script (e.g. set selected variation for video generation)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let payload
    try {
      payload = verifyToken(token)
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    if (!payload.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = patchSchema.parse(body)

    const script = await prisma.aIInfluencerScript.findFirst({
      where: { id, tenantId: payload.tenantId },
    })

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    const variations = (script.variations as any) || []
    if (validated.selectedVariation >= variations.length) {
      return NextResponse.json(
        { error: 'Invalid selectedVariation index' },
        { status: 400 }
      )
    }

    await prisma.aIInfluencerScript.update({
      where: { id },
      data: { selectedVariation: validated.selectedVariation },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Script PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update script', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
