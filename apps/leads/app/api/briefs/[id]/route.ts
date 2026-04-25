import { NextResponse } from 'next/server'
import { LeadBriefService } from '@payaid/leads-core'
import { prisma } from '@payaid/db'

const service = new LeadBriefService()

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const { id } = await params
  const item = await prisma.leadBrief.findFirst({ where: { id, tenantId } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json()
  const tenantId = body.tenantId as string
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
  const { id } = await params
  const item = await service.update(tenantId, id, body)
  return NextResponse.json(item)
}
