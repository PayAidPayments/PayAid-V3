import { prisma } from '@payaid/db'
import { LEAD_JOBS, type LeadJobName } from '../jobs/leadJobs'

export async function runLeadJob(jobName: LeadJobName, payload: Record<string, unknown>) {
  switch (jobName) {
    case LEAD_JOBS.RUN_DISCOVERY:
      return { status: 'queued', payload }
    case LEAD_JOBS.ENRICH_ACCOUNT:
    case LEAD_JOBS.RESOLVE_CONTACTS:
    case LEAD_JOBS.ENRICH_CONTACT:
    case LEAD_JOBS.COMPUTE_SCORE:
    case LEAD_JOBS.REFRESH_SEGMENT:
    case LEAD_JOBS.REENRICH_SEGMENT:
    case LEAD_JOBS.SYNC_TO_CRM:
      return syncLeadRecordsToCrm(payload)
    case LEAD_JOBS.START_SEQUENCE:
    case LEAD_JOBS.GENERATE_EXPORT:
    case LEAD_JOBS.AUDIT_SWEEP:
      return { status: 'queued', payload }
    default:
      throw new Error(`Unsupported job: ${jobName}`)
  }
}

export async function recordLeadProviderUsage(input: {
  tenantId: string
  provider: string
  operation: string
  units: number
  estimatedCost?: number
  latencyMs?: number
  success?: boolean
}) {
  await prisma.leadProviderUsage.create({
    data: {
      tenantId: input.tenantId,
      provider: input.provider,
      operation: input.operation,
      units: input.units,
      estimatedCost: input.estimatedCost,
      latencyMs: input.latencyMs,
      success: input.success ?? true,
    },
  })
}

async function syncLeadRecordsToCrm(payload: Record<string, unknown>) {
  const tenantId = String(payload.orgId ?? '')
  const accountIds = Array.isArray(payload.accountIds) ? payload.accountIds.map(String) : []
  const contactIds = Array.isArray(payload.contactIds) ? payload.contactIds.map(String) : []
  const skipDuplicates = Boolean((payload.options as { skipDuplicates?: boolean } | undefined)?.skipDuplicates)
  const assignOwner = Boolean((payload.options as { assignOwner?: boolean } | undefined)?.assignOwner)
  const createTasks = Boolean((payload.options as { createTasks?: boolean } | undefined)?.createTasks)
  const explicitOwnerUserId = (payload.options as { ownerUserId?: string } | undefined)?.ownerUserId

  if (!tenantId) throw new Error('Missing orgId for leadActivation.syncToCrm')

  const ownerSalesRep =
    assignOwner || createTasks
      ? await prisma.salesRep.findFirst({
          where: {
            tenantId,
            ...(explicitOwnerUserId ? { userId: explicitOwnerUserId } : {}),
          },
          orderBy: { createdAt: 'asc' },
          select: { id: true, userId: true },
        })
      : null

  const [leadAccounts, leadContacts] = await Promise.all([
    prisma.leadAccount.findMany({ where: { tenantId, id: { in: accountIds } } }),
    contactIds.length > 0
      ? prisma.leadContact.findMany({ where: { tenantId, id: { in: contactIds } } })
      : prisma.leadContact.findMany({ where: { tenantId, accountId: { in: accountIds } } }),
  ])

  let accountsCreated = 0
  let accountsMerged = 0
  let contactsCreated = 0
  let contactsMerged = 0
  let tasksCreated = 0

  const crmContactIds: string[] = []

  const accountMap = new Map<string, string>()

  for (const leadAccount of leadAccounts) {
    const existing = await prisma.account.findFirst({
      where: {
        tenantId,
        OR: [
          ...(leadAccount.domain ? [{ website: `https://${leadAccount.domain}` }, { website: `http://${leadAccount.domain}` }] : []),
          { name: leadAccount.companyName },
        ],
      },
    })

    if (existing) {
      accountMap.set(leadAccount.id, existing.id)
      accountsMerged += 1
      if (!skipDuplicates) {
        await prisma.account.update({
          where: { id: existing.id },
          data: {
            industry: existing.industry ?? leadAccount.industry ?? undefined,
            city: existing.city ?? leadAccount.city ?? undefined,
            state: existing.state ?? leadAccount.region ?? undefined,
            country: existing.country ?? leadAccount.country ?? undefined,
            employeeCount: existing.employeeCount ?? leadAccount.employeeCount ?? undefined,
            website: existing.website ?? leadAccount.websiteUrl ?? undefined,
          },
        })
      }
    } else {
      const created = await prisma.account.create({
        data: {
          tenantId,
          name: leadAccount.companyName,
          industry: leadAccount.industry,
          city: leadAccount.city,
          state: leadAccount.region,
          country: leadAccount.country ?? 'India',
          employeeCount: leadAccount.employeeCount,
          website: leadAccount.websiteUrl,
          phone: undefined,
          email: undefined,
        },
      })
      accountMap.set(leadAccount.id, created.id)
      accountsCreated += 1
    }
  }

  for (const leadContact of leadContacts) {
    const existing = await prisma.contact.findFirst({
      where: {
        tenantId,
        OR: [
          ...(leadContact.workEmail ? [{ email: leadContact.workEmail }] : []),
          ...(leadContact.phone ? [{ phone: leadContact.phone }] : []),
          { name: leadContact.fullName },
        ],
      },
    })

    if (existing) {
      contactsMerged += 1
      if (!skipDuplicates) {
        await prisma.contact.update({
          where: { id: existing.id },
          data: {
            email: existing.email ?? leadContact.workEmail ?? undefined,
            phone: existing.phone ?? leadContact.phone ?? undefined,
            source: existing.source ?? 'lead-intelligence',
            accountId: existing.accountId ?? accountMap.get(leadContact.accountId) ?? undefined,
            assignedToId: existing.assignedToId ?? ownerSalesRep?.id ?? undefined,
          },
        })
      }
      crmContactIds.push(existing.id)
    } else {
      const createdContact = await prisma.contact.create({
        data: {
          tenantId,
          name: leadContact.fullName,
          email: leadContact.workEmail,
          phone: leadContact.phone,
          source: 'lead-intelligence',
          stage: 'prospect',
          status: 'active',
          accountId: accountMap.get(leadContact.accountId),
          assignedToId: ownerSalesRep?.id,
          city: null,
          state: null,
          country: 'India',
          tags: [],
        },
      })
      crmContactIds.push(createdContact.id)
      contactsCreated += 1
    }

    await prisma.leadContact.update({
      where: { id: leadContact.id },
      data: { status: 'ACTIVATED' },
    })
  }

  await prisma.leadAccount.updateMany({
    where: { tenantId, id: { in: leadAccounts.map((account) => account.id) } },
    data: { status: 'ACTIVATED' },
  })

  if (createTasks && crmContactIds.length > 0) {
    for (const contactId of crmContactIds) {
      await prisma.task.create({
        data: {
          tenantId,
          title: 'Lead activation follow-up',
          description: 'Reach out to newly activated lead from Lead Intelligence module.',
          priority: 'medium',
          status: 'pending',
          module: 'crm',
          contactId,
          assignedToId: ownerSalesRep?.userId,
          dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      })
      tasksCreated += 1
    }
  }

  return {
    status: 'completed',
    summary: {
      accountsCreated,
      accountsMerged,
      contactsCreated,
      contactsMerged,
      tasksCreated,
      assignedOwnerUserId: ownerSalesRep?.userId ?? null,
    },
  }
}
