import { prisma } from '@payaid/db'
import Link from 'next/link'
import { SegmentWorkspaceClient } from './SegmentWorkspaceClient'

export default async function LeadSegmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tenantId?: string }>
}) {
  const { id } = await params
  const { tenantId } = await searchParams

  if (!tenantId) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <p className="text-sm text-red-600">tenantId is required in query string.</p>
      </main>
    )
  }

  const [segment, accounts] = await Promise.all([
    prisma.leadSegment.findFirst({ where: { id, tenantId }, include: { brief: true } }),
    prisma.leadAccount.findMany({
      where: { tenantId, segmentId: id },
      orderBy: [{ conversionPotential: 'desc' }, { id: 'asc' }],
      take: 50,
      include: {
        contacts: {
          select: { id: true },
        },
      },
    }),
  ])

  if (!segment) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <p className="text-sm text-red-600">Segment not found.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{segment.name}</h1>
            <p className="text-sm text-slate-600">
              Brief: {segment.brief.name} - State: {segment.discoveryState}
            </p>
          </div>
          <Link
            href={`/activation?tenantId=${tenantId}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium"
          >
            Open Activation
          </Link>
        </header>

        <SegmentWorkspaceClient tenantId={tenantId} segmentId={segment.id} accounts={accounts} />
      </div>
    </main>
  )
}
