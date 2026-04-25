import { NextResponse } from 'next/server'
import { LeadDiscoveryService } from '@payaid/leads-core'

const discoveryService = new LeadDiscoveryService()

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const limit = Number(searchParams.get('limit') ?? '25')
  const cursor = searchParams.get('cursor') ?? undefined
  const { id } = await params

  const data = await discoveryService.listSegmentResults({ tenantId, segmentId: id, limit, cursor })
  return NextResponse.json(data)
}
