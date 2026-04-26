import { prisma } from '@payaid/db'
import { LEAD_JOBS, runLeadJob } from '@payaid/queue'
import type { ActivationRequest } from '../types'

type ActivationRiskSeverity = 'warning' | 'blocked'
type ActivationRiskCode =
  | 'DUPLICATE_ACCOUNT_IN_CRM'
  | 'DUPLICATE_CONTACT_IN_CRM'
  | 'CONSENT_RESTRICTED_CONTACT'
  | 'UNVERIFIED_EMAIL_SELECTED'
  | 'UNKNOWN_EMAIL_STATUS_SELECTED'
  | 'UNVERIFIED_PHONE_SELECTED'

interface ActivationRiskReason {
  code: ActivationRiskCode
  severity: ActivationRiskSeverity
  message: string
  count?: number
}

export class LeadActivationService {
  async preview(input: ActivationRequest) {
    const [accounts, contacts] = await Promise.all([
      prisma.leadAccount.findMany({
        where: { tenantId: input.orgId, id: { in: input.accountIds } },
        select: { id: true, companyName: true, domain: true },
      }),
      input.contactIds?.length
        ? prisma.leadContact.findMany({
            where: { tenantId: input.orgId, id: { in: input.contactIds } },
            select: { id: true, workEmail: true, fullName: true, emailStatus: true, phoneStatus: true },
          })
        : Promise.resolve([]),
    ])

    const warnings: string[] = []
    const reasons: ActivationRiskReason[] = []

    const accountDomains = accounts.map((account) => account.domain).filter((domain): domain is string => Boolean(domain))
    if (accountDomains.length > 0) {
      const existingAccounts = await prisma.account.findMany({
        where: {
          tenantId: input.orgId,
          website: { in: accountDomains.map((domain) => `https://${domain}`) },
        },
        select: { name: true, website: true },
      })

      if (existingAccounts.length > 0) {
        const message = `Potential account duplicates detected (${existingAccounts.length}) in CRM account records.`
        warnings.push(message)
        reasons.push({
          code: 'DUPLICATE_ACCOUNT_IN_CRM',
          severity: 'warning',
          message,
          count: existingAccounts.length,
        })
      }
    }

    const contactEmails = contacts.map((contact) => contact.workEmail).filter((email): email is string => Boolean(email))
    if (contactEmails.length > 0) {
      const existingContacts = await prisma.contact.findMany({
        where: { tenantId: input.orgId, email: { in: contactEmails } },
        select: { name: true, email: true },
      })
      if (existingContacts.length > 0) {
        const message = `Potential contact duplicates detected (${existingContacts.length}) in CRM contacts.`
        warnings.push(message)
        reasons.push({
          code: 'DUPLICATE_CONTACT_IN_CRM',
          severity: 'warning',
          message,
          count: existingContacts.length,
        })
      }
    }

    if (contacts.length > 0) {
      const unverifiedEmailCount = contacts.filter((contact) => contact.emailStatus === 'UNVERIFIED').length
      const unknownEmailCount = contacts.filter((contact) => contact.emailStatus === 'UNKNOWN').length
      if (unverifiedEmailCount > 0) {
        const message = `${unverifiedEmailCount} selected contacts have UNVERIFIED email status and should be reviewed before activation.`
        warnings.push(message)
        reasons.push({
          code: 'UNVERIFIED_EMAIL_SELECTED',
          severity: 'blocked',
          message,
          count: unverifiedEmailCount,
        })
      }
      if (unknownEmailCount > 0) {
        const message = `${unknownEmailCount} selected contacts do not have email verification evidence yet.`
        warnings.push(message)
        reasons.push({
          code: 'UNKNOWN_EMAIL_STATUS_SELECTED',
          severity: 'warning',
          message,
          count: unknownEmailCount,
        })
      }

      const unverifiedPhoneCount = contacts.filter((contact) => contact.phoneStatus === 'UNVERIFIED').length
      if (unverifiedPhoneCount > 0) {
        const message = `${unverifiedPhoneCount} selected contacts have UNVERIFIED phone status.`
        warnings.push(message)
        reasons.push({
          code: 'UNVERIFIED_PHONE_SELECTED',
          severity: 'warning',
          message,
          count: unverifiedPhoneCount,
        })
      }

      const blockedContacts = await prisma.leadConsentProfile.count({
        where: {
          tenantId: input.orgId,
          contactId: { in: contacts.map((contact) => contact.id) },
          OR: [{ doNotEnrich: true }, { exportAllowed: false }],
        },
      })
      if (blockedContacts > 0) {
        const message = `${blockedContacts} selected contacts are restricted by consent/suppression policy.`
        warnings.push(message)
        reasons.push({
          code: 'CONSENT_RESTRICTED_CONTACT',
          severity: 'blocked',
          message,
          count: blockedContacts,
        })
      }
    }

    const blockedReasons = reasons.filter((reason) => reason.severity === 'blocked')
    return {
      destination: input.destination,
      accountCount: accounts.length,
      contactCount: contacts.length,
      options: input.options,
      warnings,
      reasons,
      risk: {
        blocked: blockedReasons.length > 0,
        blockedCount: blockedReasons.length,
        blockedCodes: blockedReasons.map((reason) => reason.code),
      },
    }
  }

  async enqueue(input: ActivationRequest): Promise<{ jobId: string }> {
    const job = await prisma.leadActivationJob.create({
      data: {
        tenantId: input.orgId,
        segmentId: input.segmentId,
        initiatedById: 'system',
        destination: input.destination,
        status: 'PENDING',
        payload: input,
      },
    })

    try {
      await prisma.leadActivationJob.update({
        where: { id: job.id },
        data: { status: 'RUNNING' },
      })

      const result = await runLeadJob(LEAD_JOBS.SYNC_TO_CRM, input as unknown as Record<string, unknown>)

      await prisma.leadActivationJob.update({
        where: { id: job.id },
        data: { status: 'COMPLETED', resultSummary: result as object },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown activation failure'
      await prisma.leadActivationJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          resultSummary: { error: message },
        },
      })
      throw error
    }

    return { jobId: job.id }
  }
}
