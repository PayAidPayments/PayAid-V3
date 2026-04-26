import { NextResponse } from 'next/server'
import { LeadActivationService } from '@payaid/leads-core'

const service = new LeadActivationService()

export async function POST(request: Request) {
  const input = await request.json()
  if (!input?.orgId) return NextResponse.json({ error: 'orgId is required' }, { status: 400 })

  const preview = await service.preview(input)
  if (!input?.confirmEnqueue) {
    return NextResponse.json({ mode: 'preview', preview })
  }

  if (preview?.risk?.blocked && !input?.overrideBlockedRisk) {
    return NextResponse.json(
      {
        mode: 'blocked',
        error: 'Activation blocked by risk policy. Resolve blocked reasons or pass overrideBlockedRisk=true.',
        preview,
      },
      { status: 409 },
    )
  }

  const enqueued = await service.enqueue(input)
  return NextResponse.json({ mode: 'enqueued', preview, ...enqueued })
}
