import { prisma } from '@payaid/db'
import type { CompanyDiscoveryRequest, LeadAccountListItemView } from '../types'

export class LeadDiscoveryService {
  async enqueueSegmentRun(input: CompanyDiscoveryRequest): Promise<{ jobId: string }> {
    await prisma.leadSegment.update({
      where: { id: input.segmentId },
      data: {
        discoveryState: 'QUEUED',
        status: 'RUNNING',
        lastRunAt: new Date(),
      },
    })

    return { jobId: `leadBrief.runDiscovery:${input.segmentId}` }
  }

  async listSegmentResults(input: {
    tenantId: string
    segmentId: string
    limit: number
    cursor?: string
  }): Promise<{ items: LeadAccountListItemView[]; nextCursor?: string }> {
    const accounts = await prisma.leadAccount.findMany({
      where: { tenantId: input.tenantId, segmentId: input.segmentId },
      orderBy: [{ conversionPotential: 'desc' }, { id: 'asc' }],
      take: input.limit,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      include: { contacts: { select: { emailStatus: true } }, signals: { select: { title: true }, take: 1 } },
    })

    const items: LeadAccountListItemView[] = accounts.map((account) => ({
      id: account.id,
      companyName: account.companyName,
      domain: account.domain ?? undefined,
      industry: account.industry ?? undefined,
      city: account.city ?? undefined,
      employeeBand: account.employeeBand ?? undefined,
      conversionPotential: account.conversionPotential,
      fitScore: account.fitScore,
      intentScore: account.intentScore,
      verifiedContactCount: account.contacts.filter((c) => c.emailStatus === 'VERIFIED').length,
      topSignal: account.signals[0]?.title,
      freshnessLabel: account.freshnessScore >= 70 ? 'fresh' : account.freshnessScore >= 40 ? 'aging' : 'stale',
      recommendedAction:
        account.status === 'APPROVED'
          ? 'activate'
          : account.status === 'SHORTLISTED'
            ? 'resolve_contacts'
            : 'review',
    }))

    const nextCursor = accounts.length === input.limit ? accounts[accounts.length - 1]?.id : undefined
    return { items, nextCursor }
  }
}
