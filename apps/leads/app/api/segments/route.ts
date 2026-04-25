import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'

export async function POST(request: Request) {
  const body = await request.json()
  const tenantId = body.tenantId as string
  const briefId = body.briefId as string
  const name = body.name as string

  if (!tenantId || !briefId || !name) {
    return NextResponse.json({ error: 'tenantId, briefId, and name are required' }, { status: 400 })
  }

  const segment = await prisma.leadSegment.create({
    data: { tenantId, briefId, name, discoveryState: 'IDLE', status: 'DRAFT' },
  })
  return NextResponse.json(segment, { status: 201 })
}
