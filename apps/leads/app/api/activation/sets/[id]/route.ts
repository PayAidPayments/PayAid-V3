import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const { id } = await params
  const set = await prisma.leadActivationJob.findFirst({
    where: { id, tenantId, destination: 'activation_set' },
  })
  if (!set) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(set)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json()
  const tenantId = body.tenantId as string
  const action = body.action as 'duplicate' | 'archive' | 'unarchive'
  if (!tenantId || !action) {
    return NextResponse.json({ error: 'tenantId and action are required' }, { status: 400 })
  }

  const { id } = await params
  const existing = await prisma.leadActivationJob.findFirst({
    where: { id, tenantId, destination: 'activation_set' },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const payload = (existing.payload ?? {}) as Record<string, unknown>

  if (action === 'duplicate') {
    const duplicated = await prisma.leadActivationJob.create({
      data: {
        tenantId,
        segmentId: existing.segmentId,
        initiatedById: body.initiatedById ?? existing.initiatedById ?? 'system',
        destination: 'activation_set',
        status: 'PENDING',
        payload: {
          ...payload,
          setName: `${String(payload.setName ?? 'Activation Set')} (Copy)`,
          savedAt: new Date().toISOString(),
          archivedAt: undefined,
        },
        resultSummary: existing.resultSummary ?? undefined,
      },
    })
    return NextResponse.json({ id: duplicated.id })
  }

  const nextPayload =
    action === 'archive'
      ? { ...payload, archivedAt: new Date().toISOString() }
      : { ...payload, archivedAt: undefined }

  const updated = await prisma.leadActivationJob.update({
    where: { id: existing.id },
    data: { payload: nextPayload },
  })
  return NextResponse.json({ id: updated.id })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const { id } = await params
  const existing = await prisma.leadActivationJob.findFirst({
    where: { id, tenantId, destination: 'activation_set' },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.leadActivationJob.delete({ where: { id: existing.id } })
  return NextResponse.json({ ok: true })
}
