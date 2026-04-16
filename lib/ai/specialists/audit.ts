import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import { SpecialistAuditEvent } from './types'

export type SpecialistActivitySource = 'specialist_table' | 'legacy_audit'

export interface SpecialistAuditEventRow {
  id: string
  timestamp: Date
  changedBy: string
  event: SpecialistAuditEvent
}

export interface SpecialistAuditQueryResult {
  source: SpecialistActivitySource
  migrationReady: boolean
  fallbackReason: string | null
  rows: SpecialistAuditEventRow[]
}

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function isSpecialistTableUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2021' || error.code === 'P2022'
  }
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return message.includes('specialistactivitylog') && (
    message.includes('does not exist') ||
    message.includes('unknown') ||
    message.includes('not found')
  )
}

function buildFallbackReason(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2021') return 'specialist_activity_table_missing'
    if (error.code === 'P2022') return 'specialist_activity_column_missing'
    return `specialist_activity_prisma_${error.code.toLowerCase()}`
  }
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('specialistactivitylog')
      ? 'specialist_activity_table_unavailable'
      : 'specialist_activity_query_failed'
  }
  return 'specialist_activity_unknown_fallback'
}

async function writeLegacyAuditLog(params: {
  tenantId: string
  userId: string
  event: SpecialistAuditEvent
}) {
  return prisma.auditLog.create({
    data: {
      tenantId: params.tenantId,
      entityType: 'ai_specialist_event',
      entityId: params.event.sessionId,
      changedBy: params.userId,
      changeSummary: `${params.event.specialistName}: ${params.event.eventType}`,
      afterSnapshot: asInputJson(params.event),
    },
  })
}

export async function recordSpecialistAuditEvent(params: {
  tenantId: string
  userId: string
  event: SpecialistAuditEvent
}) {
  const approvalRequired = params.event.actionLevel === 'restricted'
  const permissionsChecked = [
    `specialist:${params.event.specialistId}`,
    `module:${params.event.module}`,
    `action_level:${params.event.actionLevel}`,
  ]

  let specialistLog: { id: string } | null = null
  try {
    specialistLog = await prisma.specialistActivityLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        specialistId: params.event.specialistId,
        specialistName: params.event.specialistName,
        module: params.event.module,
        sessionId: params.event.sessionId,
        prompt: params.event.prompt,
        intent: params.event.prompt.slice(0, 160),
        contextSources: params.event.contextSources ?? [],
        permissionsChecked,
        permissionResult: params.event.permissionResult,
        actionLevel: params.event.actionLevel,
        approvalRequired,
        approvalBy: null,
        result: params.event.result ?? (params.event.permissionResult === 'granted' ? 'success' : 'blocked'),
        errorCode: params.event.result === 'error' ? 'SPECIALIST_RUNTIME_ERROR' : null,
        reason: params.event.reason,
        latencyMs: params.event.latencyMs ?? null,
        metadata: asInputJson({
          eventType: params.event.eventType,
        }),
      },
      select: { id: true },
    })
  } catch (error) {
    if (!isSpecialistTableUnavailable(error)) throw error
  }

  const legacyLog = await writeLegacyAuditLog(params)
  return specialistLog ?? legacyLog
}

export async function listSpecialistAuditEvents(params: {
  tenantId: string
  specialistId?: string
  module?: string
  actionLevel?: string
  result?: string
  startDate?: Date
  endDate?: Date
  limit: number
}): Promise<SpecialistAuditQueryResult> {
  try {
    const rows = await prisma.specialistActivityLog.findMany({
      where: {
        tenantId: params.tenantId,
        ...(params.specialistId ? { specialistId: params.specialistId } : {}),
        ...(params.module ? { module: params.module } : {}),
        ...(params.actionLevel ? { actionLevel: params.actionLevel } : {}),
        ...(params.result ? { result: params.result } : {}),
        ...((params.startDate || params.endDate)
          ? {
              createdAt: {
                ...(params.startDate ? { gte: params.startDate } : {}),
                ...(params.endDate ? { lte: params.endDate } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit,
    })

    return {
      source: 'specialist_table',
      migrationReady: true,
      fallbackReason: null,
      rows: rows.map((row) => ({
        id: row.id,
        timestamp: row.createdAt,
        changedBy: row.userId,
        event: {
          eventType: String((row.metadata as { eventType?: string } | null)?.eventType || 'specialist.response.completed'),
          specialistId: row.specialistId,
          specialistName: row.specialistName,
          module: row.module,
          actionLevel: row.actionLevel as SpecialistAuditEvent['actionLevel'],
          sessionId: row.sessionId,
          prompt: row.prompt,
          permissionResult: row.permissionResult as 'granted' | 'denied',
          reason: row.reason ?? undefined,
          contextSources: row.contextSources,
          result: row.result as 'success' | 'blocked' | 'error',
          latencyMs: row.latencyMs ?? undefined,
        } as SpecialistAuditEvent,
      })),
    }
  } catch (error) {
    if (!isSpecialistTableUnavailable(error)) throw error
    const fallbackReason = buildFallbackReason(error)
    const fallbackRows = await prisma.auditLog.findMany({
      where: {
        tenantId: params.tenantId,
        entityType: 'ai_specialist_event',
        ...((params.startDate || params.endDate)
          ? {
              timestamp: {
                ...(params.startDate ? { gte: params.startDate } : {}),
                ...(params.endDate ? { lte: params.endDate } : {}),
              },
            }
          : {}),
      },
      orderBy: { timestamp: 'desc' },
      take: Math.min(params.limit * 5, 500),
    })

    const rows = fallbackRows
      .map((row) => ({
        id: row.id,
        timestamp: row.timestamp,
        changedBy: row.changedBy,
        event: row.afterSnapshot as unknown as SpecialistAuditEvent | null,
      }))
      .filter((row): row is SpecialistAuditEventRow => row.event !== null)
      .filter((row) => (params.specialistId ? row.event.specialistId === params.specialistId : true))
      .filter((row) => (params.module ? row.event.module === params.module : true))
      .filter((row) => (params.actionLevel ? row.event.actionLevel === params.actionLevel : true))
      .filter((row) => (params.result ? row.event.result === params.result : true))
      .slice(0, params.limit)

    return {
      source: 'legacy_audit',
      migrationReady: false,
      fallbackReason,
      rows,
    }
  }
}

