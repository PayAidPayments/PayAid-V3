import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@prisma/client'

export type OutboxTenantReconciliation = {
  tenantId: string
  queuedCount: number
  dispatchedCount: number
  dlqCount: number
  driftCount: number
  hasRisk: boolean
}

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

export async function reconcileOutboxHealthAcrossTenants() {
  const [queuedByTenant, dispatchedByTenant, dlqByTenant] = await Promise.all([
    prisma.auditLog.groupBy({
      by: ['tenantId'],
      where: { entityType: 'outbox_event' },
      _count: { id: true },
    }),
    prisma.auditLog.groupBy({
      by: ['tenantId'],
      where: { entityType: 'outbox_dispatch' },
      _count: { id: true },
    }),
    prisma.auditLog.groupBy({
      by: ['tenantId'],
      where: { entityType: 'outbox_dlq' },
      _count: { id: true },
    }),
  ])

  const map = new Map<string, OutboxTenantReconciliation>()

  for (const row of queuedByTenant) {
    map.set(row.tenantId, {
      tenantId: row.tenantId,
      queuedCount: row._count.id,
      dispatchedCount: 0,
      dlqCount: 0,
      driftCount: 0,
      hasRisk: false,
    })
  }

  for (const row of dispatchedByTenant) {
    const current = map.get(row.tenantId) || {
      tenantId: row.tenantId,
      queuedCount: 0,
      dispatchedCount: 0,
      dlqCount: 0,
      driftCount: 0,
      hasRisk: false,
    }
    current.dispatchedCount = row._count.id
    map.set(row.tenantId, current)
  }

  for (const row of dlqByTenant) {
    const current = map.get(row.tenantId) || {
      tenantId: row.tenantId,
      queuedCount: 0,
      dispatchedCount: 0,
      dlqCount: 0,
      driftCount: 0,
      hasRisk: false,
    }
    current.dlqCount = row._count.id
    map.set(row.tenantId, current)
  }

  const reconciliations = Array.from(map.values()).map((row) => {
    const driftCount = Math.max(0, row.queuedCount - row.dispatchedCount - row.dlqCount)
    const hasRisk = row.dlqCount > 0 || driftCount > 0
    return {
      ...row,
      driftCount,
      hasRisk,
    }
  })

  const riskyTenants = reconciliations.filter((row) => row.hasRisk)

  // Alert model requires sales-rep scoped fields; for tenant-wide reconciliation we persist risk via audit rows below.

  const runTs = new Date().toISOString()
  await Promise.all(
    reconciliations.map((row) =>
      prisma.auditLog.create({
        data: {
          tenantId: row.tenantId,
          entityType: 'outbox_reconciliation_run',
          entityId: `recon_${row.tenantId}_${Date.now()}`,
          changedBy: 'system',
          changeSummary: `Outbox reconciliation run at ${runTs}`,
          afterSnapshot: asInputJson({
            runAt: runTs,
            queuedCount: row.queuedCount,
            dispatchedCount: row.dispatchedCount,
            dlqCount: row.dlqCount,
            driftCount: row.driftCount,
            hasRisk: row.hasRisk,
          }),
        },
      })
    )
  )

  return {
    processedTenants: reconciliations.length,
    riskyTenants: riskyTenants.length,
    rows: reconciliations,
  }
}
