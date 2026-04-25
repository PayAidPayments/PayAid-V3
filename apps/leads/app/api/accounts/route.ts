import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  const segmentId = searchParams.get('segmentId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const items = await prisma.leadAccount.findMany({
    where: { tenantId, ...(segmentId ? { segmentId } : {}) },
    orderBy: [{ conversionPotential: 'desc' }, { id: 'asc' }],
    take: 100,
  })

  return NextResponse.json({ items })
}
