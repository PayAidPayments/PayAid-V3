import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  const query = (searchParams.get('q') ?? '').trim().toLowerCase()
  const includeArchived = searchParams.get('includeArchived') === '1'
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const pageSize = Math.min(50, Math.max(5, Number(searchParams.get('pageSize') ?? '10')))
  const sort = (searchParams.get('sort') ?? 'newest') as 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'archived_first'
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const sets = await prisma.leadActivationJob.findMany({
    where: { tenantId, destination: 'activation_set' },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const filtered = sets.filter((item) => {
    const payload = (item.payload ?? {}) as {
      setName?: string
      setTag?: string
      setNote?: string
      archivedAt?: string
    }
    if (!includeArchived && payload.archivedAt) return false
    if (!query) return true

    const haystack = [payload.setName, payload.setTag, payload.setNote, item.id]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })

  const sorted = [...filtered].sort((a, b) => {
    const payloadA = (a.payload ?? {}) as { setName?: string; archivedAt?: string }
    const payloadB = (b.payload ?? {}) as { setName?: string; archivedAt?: string }

    if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    if (sort === 'name_asc') return String(payloadA.setName ?? '').localeCompare(String(payloadB.setName ?? ''))
    if (sort === 'name_desc') return String(payloadB.setName ?? '').localeCompare(String(payloadA.setName ?? ''))
    if (sort === 'archived_first') {
      const aArchived = Boolean(payloadA.archivedAt)
      const bArchived = Boolean(payloadB.archivedAt)
      if (aArchived !== bArchived) return aArchived ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const total = sorted.length
  const start = (page - 1) * pageSize
  const items = sorted.slice(start, start + pageSize)

  return NextResponse.json({ items, total, page, pageSize, sort })
}

export async function POST(request: Request) {
  const body = await request.json()
  const tenantId = body.tenantId as string
  const initiatedById = (body.initiatedById as string) || 'system'
  const accountIds = Array.isArray(body.accountIds) ? (body.accountIds as string[]) : []
  const contactIds = Array.isArray(body.contactIds) ? (body.contactIds as string[]) : []
  const segmentId = (body.segmentId as string | undefined) ?? null
  const setName = typeof body.setName === 'string' ? body.setName.trim() : ''
  const setNote = typeof body.setNote === 'string' ? body.setNote.trim() : ''
  const setTag = typeof body.setTag === 'string' ? body.setTag.trim() : ''

  const finalSetName = setName || `Activation Set ${new Date().toISOString()}`

  if (!tenantId || accountIds.length === 0) {
    return NextResponse.json({ error: 'tenantId and at least one accountId are required' }, { status: 400 })
  }

  const set = await prisma.leadActivationJob.create({
    data: {
      tenantId,
      segmentId,
      initiatedById,
      destination: 'activation_set',
      status: 'PENDING',
      payload: {
        tenantId,
        setName: finalSetName,
        setNote: setNote || undefined,
        setTag: setTag || undefined,
        accountIds,
        contactIds,
        accountCount: accountIds.length,
        contactCount: contactIds.length,
        savedAt: new Date().toISOString(),
      },
      resultSummary: {
        kind: 'activation_set',
        setName: finalSetName,
        setTag: setTag || undefined,
        accountCount: accountIds.length,
        contactCount: contactIds.length,
      },
    },
  })

  return NextResponse.json({ id: set.id }, { status: 201 })
}
