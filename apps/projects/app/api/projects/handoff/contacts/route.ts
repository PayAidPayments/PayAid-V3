import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** GET /api/projects/handoff/contacts — tenant-scoped contact search for project create */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'projects')
    const { searchParams } = request.nextUrl
    const search = (searchParams.get('search') || '').trim()
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 50)

    const contacts = await prisma.contact.findMany({
      where: {
        tenantId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        stage: true,
      },
      orderBy: { name: 'asc' },
      take: limit,
    })

    return NextResponse.json({ contacts })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error as { moduleId: string })
    }
    console.error('Handoff contacts error:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}
