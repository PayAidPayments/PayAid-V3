import { NextResponse } from 'next/server'
import { LeadActivationService } from '@payaid/leads-core'

const service = new LeadActivationService()

export async function POST(request: Request) {
  const input = await request.json()
  if (!input?.orgId) return NextResponse.json({ error: 'orgId is required' }, { status: 400 })

  const enqueued = await service.enqueue({ ...input, destination: 'sequence' })
  return NextResponse.json(enqueued)
}
