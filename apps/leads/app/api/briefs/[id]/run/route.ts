import { NextResponse } from 'next/server'
import { LeadBriefService } from '@payaid/leads-core'

const service = new LeadBriefService()

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json()
  const tenantId = body.tenantId as string
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const { id } = await params
  const result = await service.run(tenantId, id)
  return NextResponse.json(result)
}
