import { prisma } from '@payaid/db'
import type { CompanyCandidate } from '../types'
import { LeadMergeService } from './LeadMergeService'
import { LeadScoreService } from './LeadScoreService'

export class LeadDiscoveryOrchestratorService {
  private readonly mergeService = new LeadMergeService()
  private readonly scoreService = new LeadScoreService()

  async persistCandidates(input: { tenantId: string; segmentId: string; candidates: CompanyCandidate[] }) {
    const merged = this.mergeService.mergeCompanyCandidates(input.candidates)

    const persisted = []
    for (const company of merged) {
      const score = this.scoreService.computeAccountScore({
        fitScore: 60,
        intentScore: 45,
        reachabilityScore: 35,
        sourceCoverageScore: company.sourceCoverageScore,
        whyNow: ['Company profile matched brief filters'],
      })

      const account = await prisma.leadAccount.create({
        data: {
          tenantId: input.tenantId,
          segmentId: input.segmentId,
          domain: company.domain,
          companyName: company.companyName,
          normalizedName: company.normalizedName,
          websiteUrl: company.websiteUrl,
          linkedinUrl: company.linkedinUrl,
          country: company.country,
          region: company.region,
          city: company.city,
          employeeCount: company.employeeCount,
          employeeBand: company.employeeBand,
          revenueBand: company.revenueBand,
          industry: company.industry,
          subIndustry: company.subIndustry,
          techStack: company.techStack ?? [],
          fitScore: score.fitScore,
          intentScore: score.intentScore,
          reachabilityScore: score.reachabilityScore,
          conversionPotential: score.compositeScore,
          freshnessScore: 70,
          sourceCoverageScore: company.sourceCoverageScore,
          status: 'DISCOVERED',
        },
      })

      await prisma.leadScore.create({
        data: {
          tenantId: input.tenantId,
          accountId: account.id,
          scoreType: 'ACCOUNT',
          fitScore: score.fitScore,
          intentScore: score.intentScore,
          reachabilityScore: score.reachabilityScore,
          compositeScore: score.compositeScore,
          explanation: {
            whyNow: score.whyNow,
            channel: score.recommendedChannel,
            angle: score.recommendedAngle,
            version: score.explanationVersion,
          },
          modelVersion: 'deterministic-v1',
        },
      })

      if (company.evidence.length > 0) {
        await prisma.leadFieldEvidence.createMany({
          data: company.evidence.map((evidence) => ({
            tenantId: input.tenantId,
            accountId: account.id,
            fieldName: evidence.fieldName,
            rawValue: evidence.rawValue,
            normalizedValue: evidence.normalizedValue,
            provider: evidence.provider,
            confidence: evidence.confidence,
            verificationStatus: evidence.verificationStatus,
            sourceUrl: evidence.sourceUrl,
            sourceType: 'provider',
            legalBasis: evidence.legalBasis,
            observedAt: evidence.observedAt,
            isWinningValue: evidence.isWinningValue,
          })),
        })
      }

      await prisma.leadEnrichmentSnapshot.create({
        data: {
          tenantId: input.tenantId,
          accountId: account.id,
          provider: company.sourceProvider,
          operation: 'discoverCompanies',
          status: 'success',
          requestFingerprint: `${input.segmentId}:${company.normalizedName}`,
          rawPayload: { company },
          normalizedPayload: company,
        },
      })

      persisted.push(account)
    }

    await prisma.leadSegment.update({
      where: { id: input.segmentId },
      data: {
        resultCount: persisted.length,
        discoveryState: 'READY',
        status: 'READY',
      },
    })

    return { createdCount: persisted.length, items: persisted }
  }
}
