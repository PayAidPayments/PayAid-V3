import { prisma } from '@payaid/db'
import { LEAD_JOBS, runLeadJob } from '@payaid/queue'
import type { ActivationRequest } from '../types'

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
            select: { id: true, workEmail: true, fullName: true },
          })
        : Promise.resolve([]),
    ])

    const warnings: string[] = []

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
        warnings.push(`Potential account duplicates detected (${existingAccounts.length}) in CRM account records.`)
      }
    }

    const contactEmails = contacts.map((contact) => contact.workEmail).filter((email): email is string => Boolean(email))
    if (contactEmails.length > 0) {
      const existingContacts = await prisma.contact.findMany({
        where: { tenantId: input.orgId, email: { in: contactEmails } },
        select: { name: true, email: true },
      })
      if (existingContacts.length > 0) {
        warnings.push(`Potential contact duplicates detected (${existingContacts.length}) in CRM contacts.`)
      }
    }

    if (contacts.length > 0) {
      const blockedContacts = await prisma.leadConsentProfile.count({
        where: {
          tenantId: input.orgId,
          contactId: { in: contacts.map((contact) => contact.id) },
          OR: [{ doNotEnrich: true }, { exportAllowed: false }],
        },
      })
      if (blockedContacts > 0) {
        warnings.push(`${blockedContacts} selected contacts are restricted by consent/suppression policy.`)
      }
    }

    return {
      destination: input.destination,
      accountCount: accounts.length,
      contactCount: contacts.length,
      options: input.options,
      warnings,
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
