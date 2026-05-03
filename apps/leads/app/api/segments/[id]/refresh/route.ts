import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { LeadDiscoveryOrchestratorService } from '@payaid/leads-core'
import { ProviderAAdapter, ProviderBAdapter, InternalFallbackProvider } from '@payaid/leads-providers'
import { recordLeadProviderUsage } from '@payaid/queue'

const orchestrator = new LeadDiscoveryOrchestratorService()

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json()
  const tenantId = body.tenantId as string
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const { id } = await params
  const updated = await prisma.leadSegment.update({
    where: { id },
    data: { discoveryState: 'QUEUED', status: 'RUNNING', lastRunAt: new Date() },
  })

  const brief = await prisma.leadBrief.findUnique({ where: { id: updated.briefId } })
  if (!brief) {
    return NextResponse.json({ error: 'Brief not found for segment' }, { status: 404 })
  }

  const discoveryInput = {
    orgId: tenantId,
    briefId: brief.id,
    segmentId: updated.id,
    limit: 25,
    searchMode: 'broad' as const,
  }

  const providers = [new ProviderAAdapter(), new ProviderBAdapter(), new InternalFallbackProvider()]
  const candidates = []
  const coverageTarget = Math.max(10, Math.floor(discoveryInput.limit * 0.6))

  for (const provider of providers) {
    const startedAt = Date.now()
    const discovered = await provider.discoverCompanies(discoveryInput)
    candidates.push(...discovered)

    await recordLeadProviderUsage({
      tenantId,
      provider: provider.name,
      operation: 'discoverCompanies',
      units: discovered.length,
      latencyMs: Date.now() - startedAt,
      success: true,
    })

    if (candidates.length >= coverageTarget) {
      break
    }
  }

  const persisted = await orchestrator.persistCandidates({
    tenantId,
    segmentId: updated.id,
    candidates,
  })

  return NextResponse.json({
    jobId: `leadSegment.refresh:${updated.id}`,
    segmentId: updated.id,
    discoveredAccounts: persisted.createdCount,
  })
}
