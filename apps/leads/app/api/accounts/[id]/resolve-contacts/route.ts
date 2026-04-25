import { NextResponse } from 'next/server'
import { LeadContactResolutionService } from '@payaid/leads-core'

const resolver = new LeadContactResolutionService()

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json()
  const tenantId = body.tenantId as string
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const contacts = Array.isArray(body.contacts) ? body.contacts : []
  const { id } = await params
  const result = await resolver.resolveAndPersist({ tenantId, accountId: id, contacts })
  return NextResponse.json(result, { status: 201 })
}
