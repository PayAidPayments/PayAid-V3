import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

const CLOSED_STAGES = ['won', 'lost'] as const

/** GET /api/projects/handoff/deals — tenant-scoped deal search for project create */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'projects')
    const { searchParams } = request.nextUrl
    const search = (searchParams.get('search') || '').trim()
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 50)
    const includeClosed = searchParams.get('includeClosed') === '1'
    const contactId = searchParams.get('contactId')?.trim() || undefined

    const deals = await prisma.deal.findMany({
      where: {
        tenantId,
        ...(contactId ? { contactId } : {}),
        ...(!includeClosed ? { stage: { notIn: [...CLOSED_STAGES] } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { contactName: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        stage: true,
        value: true,
        contactId: true,
        contact: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ deals })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error as { moduleId: string })
    }
    console.error('Handoff deals error:', error)
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
  }
}
