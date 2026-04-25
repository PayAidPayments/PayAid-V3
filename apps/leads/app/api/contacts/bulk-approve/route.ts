import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'

export async function POST(request: Request) {
  const body = await request.json()
  const tenantId = body.tenantId as string
  const ids = Array.isArray(body.ids) ? (body.ids as string[]) : []
  if (!tenantId || ids.length === 0) {
    return NextResponse.json({ error: 'tenantId and ids are required' }, { status: 400 })
  }

  const result = await prisma.leadContact.updateMany({
    where: { tenantId, id: { in: ids } },
    data: { status: 'VERIFIED', emailStatus: 'VERIFIED', lastVerifiedAt: new Date() },
  })

  return NextResponse.json({ updated: result.count })
}
