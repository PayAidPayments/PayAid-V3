import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || undefined
    const search = searchParams.get('search') || undefined

    const where: any = { expiresAt: { gt: new Date() } }
    if (tenantId) where.orgId = tenantId

    const apiKeys = await prisma.apiKey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { id: true, name: true } },
        _count: { select: { usageLogs: true } },
      },
    })

    let list = apiKeys.map((k) => ({
      id: k.id,
      orgId: k.orgId,
      tenantName: k.tenant.name,
      name: k.name,
      scopes: k.scopes,
      rateLimit: k.rateLimit,
      expiresAt: k.expiresAt.toISOString(),
      createdAt: k.createdAt.toISOString(),
      usageCount: k._count.usageLogs,
    }))

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (k) =>
          k.name.toLowerCase().includes(q) || k.tenantName.toLowerCase().includes(q)
      )
    }

    return NextResponse.json({ data: list })
  } catch (e) {
    console.error('Super admin api-keys error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
