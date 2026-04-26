import { NextResponse } from 'next/server'
import { LeadBriefService } from '@payaid/leads-core'
import { prisma } from '@payaid/db'

const service = new LeadBriefService()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const items = await prisma.leadBrief.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const body = await request.json()
  const tenantId = body.tenantId as string
  const createdById = body.createdById as string
  const prompt = typeof body.prompt === 'string' ? body.prompt : ''
  const autoRun = body.autoRun === true

  if (!tenantId || !createdById) {
    return NextResponse.json({ error: 'tenantId and createdById are required' }, { status: 400 })
  }

  const input = prompt ? service.compilePromptToBrief(prompt) : body
  const item = await service.create(tenantId, createdById, input)
  if (!autoRun) {
    return NextResponse.json({ item }, { status: 201 })
  }

  const run = await service.run(tenantId, item.id)
  return NextResponse.json({ item, run }, { status: 201 })
}
