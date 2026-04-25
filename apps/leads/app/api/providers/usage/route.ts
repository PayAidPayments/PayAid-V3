import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const usage = await prisma.leadProviderUsage.findMany({
    where: { tenantId },
    orderBy: { recordedAt: 'desc' },
    take: 200,
  })
  return NextResponse.json({ items: usage })
}
