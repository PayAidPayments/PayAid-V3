import { prisma } from '@payaid/db'
import type { ContactCandidate } from '../types'
import { LeadMergeService } from './LeadMergeService'

export class LeadContactResolutionService {
  private readonly mergeService = new LeadMergeService()

  async resolveAndPersist(input: { tenantId: string; accountId: string; contacts: ContactCandidate[] }) {
    const merged = this.mergeService.mergeContactCandidates(input.contacts)
    const created = []
    for (const contact of merged) {
      const existing = await prisma.leadContact.findFirst({
        where: {
          tenantId: input.tenantId,
          accountId: input.accountId,
          OR: [
            ...(contact.workEmail ? [{ workEmail: contact.workEmail }] : []),
            ...(contact.linkedinUrl ? [{ linkedinUrl: contact.linkedinUrl }] : []),
            { normalizedFullName: contact.normalizedFullName },
          ],
        },
      })
      if (existing) continue

      const row = await prisma.leadContact.create({
        data: {
          tenantId: input.tenantId,
          accountId: input.accountId,
          fullName: contact.fullName,
          normalizedFullName: contact.normalizedFullName,
          firstName: contact.firstName,
          lastName: contact.lastName,
          title: contact.title,
          seniority: contact.seniority,
          department: contact.department,
          linkedinUrl: contact.linkedinUrl,
          workEmail: contact.workEmail,
          phone: contact.phone,
          emailStatus: resolveContactFieldStatus(contact.evidence, 'workEmail', contact.workEmail ? 'LIKELY' : 'UNKNOWN'),
          phoneStatus: resolveContactFieldStatus(contact.evidence, 'phone', contact.phone ? 'LIKELY' : 'UNKNOWN'),
        },
      })

      if (contact.evidence.length > 0) {
        await prisma.leadFieldEvidence.createMany({
          data: contact.evidence.map((evidence) => ({
            tenantId: input.tenantId,
            contactId: row.id,
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
          contactId: row.id,
          provider: contact.sourceProvider,
          operation: 'resolveContacts',
          status: 'success',
          requestFingerprint: `${input.accountId}:${contact.normalizedFullName}`,
          rawPayload: { contact },
          normalizedPayload: contact,
        },
      })

      created.push(row)
    }

    await prisma.leadAccount.update({
      where: { id: input.accountId },
      data: { status: 'SHORTLISTED' },
    })

    return { createdCount: created.length, items: created }
  }
}

function resolveContactFieldStatus(
  evidence: Array<{ fieldName: string; verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'LIKELY' | 'UNKNOWN'; isWinningValue: boolean }>,
  fieldName: 'workEmail' | 'phone',
  fallback: 'VERIFIED' | 'UNVERIFIED' | 'LIKELY' | 'UNKNOWN',
) {
  const winner = evidence.find((item) => item.fieldName === fieldName && item.isWinningValue)
  return winner?.verificationStatus ?? fallback
}
