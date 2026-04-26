import type {
  CompanyCandidate,
  ContactCandidate,
  FieldEvidenceCandidate,
  NormalizedCompanyRecord,
  NormalizedContactRecord,
  ProviderTrustProfile,
} from '../types'

const DEFAULT_TRUST: ProviderTrustProfile = {
  provider: 'default',
  baseWeight: 50,
  strengths: ['company', 'contact'],
  freshnessTtlDays: 90,
}

function normalizeText(value?: string) {
  return (value ?? '').trim().toLowerCase()
}

export class LeadMergeService {
  constructor(private readonly trustProfiles: Record<string, ProviderTrustProfile> = {}) {}

  mergeCompanyCandidates(input: CompanyCandidate[]): NormalizedCompanyRecord[] {
    const byKey = new Map<string, CompanyCandidate[]>()
    for (const candidate of input) {
      const key = normalizeText(candidate.domain) || normalizeText(candidate.companyName)
      if (!key) continue
      const list = byKey.get(key) ?? []
      list.push(candidate)
      byKey.set(key, list)
    }

    return Array.from(byKey.values()).map((bucket) => {
      const winner = bucket.sort((a, b) => this.weightForProvider(b.provider) - this.weightForProvider(a.provider))[0]
      const evidence = this.buildCompanyEvidence(bucket, winner.provider)
      return {
        companyName: winner.companyName,
        normalizedName: normalizeText(winner.companyName),
        domain: winner.domain,
        websiteUrl: winner.websiteUrl,
        linkedinUrl: winner.linkedinUrl,
        country: winner.country,
        region: winner.region,
        city: winner.city,
        employeeCount: winner.employeeCount,
        employeeBand: winner.employeeBand,
        revenueBand: winner.revenueBand,
        industry: winner.industry,
        subIndustry: winner.subIndustry,
        techStack: winner.techStack,
        sourceProvider: winner.provider,
        sourceCoverageScore: Math.min(100, bucket.length * 25),
        evidence,
      }
    })
  }

  mergeContactCandidates(input: ContactCandidate[]): NormalizedContactRecord[] {
    const byKey = new Map<string, ContactCandidate[]>()
    for (const candidate of input) {
      const key = normalizeText(candidate.workEmail) || normalizeText(candidate.linkedinUrl) || normalizeText(candidate.fullName)
      if (!key) continue
      const list = byKey.get(key) ?? []
      list.push(candidate)
      byKey.set(key, list)
    }

    return Array.from(byKey.values()).map((bucket) => {
      const winner = bucket.sort((a, b) => this.weightForProvider(b.provider) - this.weightForProvider(a.provider))[0]
      const evidence = this.buildContactEvidence(bucket, winner.provider)
      return {
        fullName: winner.fullName,
        normalizedFullName: normalizeText(winner.fullName),
        firstName: winner.firstName,
        lastName: winner.lastName,
        title: winner.title,
        seniority: winner.seniority,
        department: winner.department,
        linkedinUrl: winner.linkedinUrl,
        workEmail: winner.workEmail,
        phone: winner.phone,
        sourceProvider: winner.provider,
        evidence,
      }
    })
  }

  private buildCompanyEvidence(bucket: CompanyCandidate[], winnerProvider: string): FieldEvidenceCandidate[] {
    const now = new Date()
    const fields: Array<{ name: string; getter: (item: CompanyCandidate) => string | undefined; verified?: boolean }> = [
      { name: 'companyName', getter: (item) => item.companyName, verified: true },
      { name: 'domain', getter: (item) => item.domain, verified: true },
      { name: 'websiteUrl', getter: (item) => item.websiteUrl, verified: true },
      { name: 'linkedinUrl', getter: (item) => item.linkedinUrl, verified: true },
      { name: 'industry', getter: (item) => item.industry },
      { name: 'employeeBand', getter: (item) => item.employeeBand },
      { name: 'revenueBand', getter: (item) => item.revenueBand },
    ]

    return fields.flatMap((field) =>
      bucket
        .map((candidate) => {
          const value = field.getter(candidate)
          if (!value) return null
          return {
            fieldName: field.name,
            rawValue: value,
            normalizedValue: normalizeText(value),
            provider: candidate.provider,
            confidence: candidate.confidence,
            verificationStatus: field.verified ? 'VERIFIED' : 'LIKELY',
            sourceUrl: candidate.sourceUrl,
            legalBasis: 'licensed_allowed',
            observedAt: now,
            isWinningValue: candidate.provider === winnerProvider,
          } as FieldEvidenceCandidate
        })
        .filter((item): item is FieldEvidenceCandidate => Boolean(item)),
    )
  }

  private buildContactEvidence(bucket: ContactCandidate[], winnerProvider: string): FieldEvidenceCandidate[] {
    const now = new Date()
    const fields: Array<{ name: string; getter: (item: ContactCandidate) => string | undefined; status: FieldEvidenceCandidate['verificationStatus'] }> = [
      { name: 'fullName', getter: (item) => item.fullName, status: 'VERIFIED' },
      { name: 'linkedinUrl', getter: (item) => item.linkedinUrl, status: 'VERIFIED' },
      { name: 'workEmail', getter: (item) => item.workEmail, status: 'LIKELY' },
      { name: 'phone', getter: (item) => item.phone, status: 'LIKELY' },
      { name: 'title', getter: (item) => item.title, status: 'LIKELY' },
    ]

    return fields.flatMap((field) =>
      bucket
        .map((candidate) => {
          const value = field.getter(candidate)
          if (!value) return null
          const confidence =
            field.name === 'workEmail'
              ? candidate.emailConfidence
              : field.name === 'phone'
                ? candidate.phoneConfidence
                : undefined
          const verificationStatus =
            field.name === 'workEmail' || field.name === 'phone'
              ? inferVerificationStatus(confidence)
              : field.status
          return {
            fieldName: field.name,
            rawValue: value,
            normalizedValue: normalizeText(value),
            provider: candidate.provider,
            confidence,
            verificationStatus,
            sourceUrl: candidate.sourceUrl,
            legalBasis: 'licensed_allowed',
            observedAt: now,
            isWinningValue: candidate.provider === winnerProvider,
          } as FieldEvidenceCandidate
        })
        .filter((item): item is FieldEvidenceCandidate => Boolean(item)),
    )
  }

  private weightForProvider(provider: string): number {
    return this.trustProfiles[provider]?.baseWeight ?? DEFAULT_TRUST.baseWeight
  }
}

function inferVerificationStatus(confidence?: number): FieldEvidenceCandidate['verificationStatus'] {
  if (typeof confidence !== 'number' || !Number.isFinite(confidence)) {
    return 'LIKELY'
  }
  if (confidence >= 0.9) return 'VERIFIED'
  if (confidence <= 0.35) return 'UNVERIFIED'
  return 'LIKELY'
}
