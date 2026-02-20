import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    await requireSuperAdmin()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    const status = msg === 'Unauthorized' ? 401 : 403
    return NextResponse.json({ error: msg }, { status })
  }
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tenantId: true,
      lastLoginAt: true,
      twoFactorEnabled: true,
      createdAt: true,
      tenant: { select: { name: true } },
    },
    orderBy: { email: 'asc' },
    take: 1000,
  })
  
  const data = users.map((u) => ({
    ...u,
    lastLoginAt: u.lastLoginAt?.toISOString() || null,
    createdAt: u.createdAt.toISOString(),
  }))
  
  return NextResponse.json({ data })
}
