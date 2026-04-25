import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json()
  const tenantId = body.tenantId as string
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const { id } = await params
  const existing = await prisma.leadAccount.findFirst({ where: { id, tenantId }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const item = await prisma.leadAccount.update({
    where: { id: existing.id },
    data: { status: 'SHORTLISTED' },
  })

  return NextResponse.json(item)
}
