import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { ensureGlobalMarketingPlaybooks, getPlaybookBySlug } from '@/lib/marketing/ensure-playbooks'

/**
 * GET /api/marketing/playbooks
 * Query: ?slug= — single playbook for campaign wizard; omit — list for tenant + globals.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    await ensureGlobalMarketingPlaybooks()

    const slug = request.nextUrl.searchParams.get('slug')
    if (slug) {
      const playbook = await getPlaybookBySlug(slug, tenantId)
      if (!playbook) {
        return NextResponse.json({ error: 'Playbook not found' }, { status: 404 })
      }
      return NextResponse.json({ playbook })
    }

    const playbooks = await prisma.marketingPlaybook.findMany({
      where: {
        isActive: true,
        OR: [{ tenantId: null }, { tenantId }],
      },
      orderBy: [{ tenantId: 'asc' }, { name: 'asc' }],
      take: 24,
    })

    return NextResponse.json({ playbooks })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Marketing playbooks GET:', error)
    return NextResponse.json({ error: 'Failed to load playbooks' }, { status: 500 })
  }
}
