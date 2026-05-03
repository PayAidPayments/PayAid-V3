import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const { id } = await params
  const item = await prisma.leadContact.findFirst({
    where: { id, tenantId },
    include: { account: true, scores: true, fieldEvidence: true, consentProfile: true },
  })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(item)
}
