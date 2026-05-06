import type { PrismaClient } from '@prisma/client'
import { normalizeSlaPolicy } from '@/lib/api/projects/service-package-sla-policy'

type PackageRow = { id: string; status: string; slaPolicy: unknown }

export type OpenSlaIncidentRow = {
  id: string
  servicePackageId: string | null
  projectId: string
  sourceType: string
  sourceId: string
  severity: string
  status: string
  title: string
  detail: string | null
  detectedAt: string
}

const OPEN = 'OPEN'
const ACKNOWLEDGED = 'ACKNOWLEDGED'
const MILESTONE = 'MILESTONE'
const TASK = 'TASK'
const WARN = 'WARN'
const BREACH = 'BREACH'

const TASK_DONE = ['DONE', 'COMPLETED', 'CANCELLED'] as const

const ACTIVE_INCIDENT = [OPEN, ACKNOWLEDGED] as const

function incidentKey(sourceType: string, sourceId: string) {
  return `${sourceType}:${sourceId}`
}

function classify(
  nowMs: number,
  dueMs: number,
  warnHoursBeforeDue: number,
  breachGraceHours: number
): 'NONE' | 'WARN' | 'BREACH' {
  const warnWindowMs = warnHoursBeforeDue * 3600000
  const graceMs = breachGraceHours * 3600000
  if (dueMs > nowMs) {
    if (warnHoursBeforeDue > 0 && dueMs - nowMs <= warnWindowMs) return 'WARN'
    return 'NONE'
  }
  if (nowMs >= dueMs + graceMs) return 'BREACH'
  return 'WARN'
}

export async function reconcileDeliverySlaIncidents(
  prisma: PrismaClient,
  tenantId: string,
  packages: PackageRow[]
): Promise<{
  openWarnCount: number
  openBreachCount: number
  openIncidents: OpenSlaIncidentRow[]
}> {
  const active = packages.filter((p) => p.status === 'ACTIVE')
  const pkgIds = active.map((p) => p.id)
  if (pkgIds.length === 0) {
    return { openWarnCount: 0, openBreachCount: 0, openIncidents: [] }
  }

  const policyByPkg = new Map(active.map((p) => [p.id, normalizeSlaPolicy(p.slaPolicy)]))

  return prisma.$transaction(async (tx) => {
    const projects = await tx.project.findMany({
      where: { tenantId, servicePackageId: { in: pkgIds } },
      select: { id: true, servicePackageId: true, name: true },
    })
    const projectIds = projects.map((p) => p.id)
    const projectToPkg = new Map(
      projects
        .filter((p) => p.servicePackageId)
        .map((p) => [p.id, p.servicePackageId as string] as const)
    )
    const projectName = new Map(projects.map((p) => [p.id, p.name]))

    if (projectIds.length === 0) {
      return { openWarnCount: 0, openBreachCount: 0, openIncidents: [] }
    }

    const now = new Date()
    const nowMs = now.getTime()

    const milestones = await tx.projectMilestone.findMany({
      where: {
        projectId: { in: projectIds },
        status: { not: 'MET' },
      },
      select: { id: true, projectId: true, name: true, dueDate: true },
    })

    const tasks = await tx.projectTask.findMany({
      where: {
        projectId: { in: projectIds },
        dueDate: { not: null },
        status: { notIn: [...TASK_DONE] },
      },
      select: { id: true, projectId: true, name: true, dueDate: true },
    })

    type Want = {
      sourceType: string
      sourceId: string
      severity: typeof WARN | typeof BREACH
      title: string
      detail: string
      servicePackageId: string
      projectId: string
    }
    const desired = new Map<string, Want>()

    for (const m of milestones) {
      const pkgId = projectToPkg.get(m.projectId)
      if (!pkgId) continue
      const pol = policyByPkg.get(pkgId)
      if (!pol?.trackMilestones) continue
      const dueMs = new Date(m.dueDate).getTime()
      if (!Number.isFinite(dueMs)) continue
      const sev = classify(nowMs, dueMs, pol.milestoneWarnHoursBeforeDue, pol.milestoneBreachGraceHours)
      if (sev === 'NONE') continue
      const proj = projectName.get(m.projectId) ?? 'Project'
      desired.set(incidentKey(MILESTONE, m.id), {
        sourceType: MILESTONE,
        sourceId: m.id,
        severity: sev === 'BREACH' ? BREACH : WARN,
        title: `${sev === 'BREACH' ? 'SLA breach' : 'SLA warning'}: milestone`,
        detail: `${proj}: ${m.name}`,
        servicePackageId: pkgId,
        projectId: m.projectId,
      })
    }

    for (const t of tasks) {
      const pkgId = projectToPkg.get(t.projectId)
      if (!pkgId) continue
      const pol = policyByPkg.get(pkgId)
      if (!pol?.trackTasks) continue
      if (!t.dueDate) continue
      const dueMs = new Date(t.dueDate).getTime()
      if (!Number.isFinite(dueMs)) continue
      const sev = classify(nowMs, dueMs, pol.taskWarnHoursBeforeDue, pol.taskBreachGraceHours)
      if (sev === 'NONE') continue
      const proj = projectName.get(t.projectId) ?? 'Project'
      desired.set(incidentKey(TASK, t.id), {
        sourceType: TASK,
        sourceId: t.id,
        severity: sev === 'BREACH' ? BREACH : WARN,
        title: `${sev === 'BREACH' ? 'SLA breach' : 'SLA warning'}: task`,
        detail: `${proj}: ${t.name}`,
        servicePackageId: pkgId,
        projectId: t.projectId,
      })
    }

    const trackedIncidents = await tx.serviceSlaIncident.findMany({
      where: {
        tenantId,
        projectId: { in: projectIds },
        status: { in: [...ACTIVE_INCIDENT] },
      },
      select: { id: true, sourceType: true, sourceId: true, status: true },
    })

    for (const row of trackedIncidents) {
      const key = incidentKey(row.sourceType, row.sourceId)
      if (!desired.has(key)) {
        await tx.serviceSlaIncident.update({
          where: { id: row.id },
          data: { status: 'RESOLVED', resolvedAt: now },
        })
      }
    }

    for (const want of desired.values()) {
      const existing = await tx.serviceSlaIncident.findFirst({
        where: {
          tenantId,
          sourceType: want.sourceType,
          sourceId: want.sourceId,
          status: { in: [...ACTIVE_INCIDENT] },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          severity: true,
          title: true,
          detail: true,
          servicePackageId: true,
          projectId: true,
        },
      })
      if (!existing) {
        await tx.serviceSlaIncident.create({
          data: {
            tenantId,
            servicePackageId: want.servicePackageId,
            projectId: want.projectId,
            sourceType: want.sourceType,
            sourceId: want.sourceId,
            severity: want.severity,
            status: OPEN,
            title: want.title,
            detail: want.detail,
            detectedAt: now,
          },
        })
        continue
      }

      const stale =
        existing.severity !== want.severity ||
        existing.title !== want.title ||
        (existing.detail ?? '') !== want.detail ||
        existing.servicePackageId !== want.servicePackageId ||
        existing.projectId !== want.projectId

      if (!stale) continue

      if (existing.status === OPEN) {
        await tx.serviceSlaIncident.update({
          where: { id: existing.id },
          data: {
            severity: want.severity,
            title: want.title,
            detail: want.detail,
            servicePackageId: want.servicePackageId,
            projectId: want.projectId,
            detectedAt: now,
          },
        })
      } else {
        await tx.serviceSlaIncident.update({
          where: { id: existing.id },
          data: {
            severity: want.severity,
            title: want.title,
            detail: want.detail,
            servicePackageId: want.servicePackageId,
            projectId: want.projectId,
          },
        })
      }
    }

    const openWarnCount = await tx.serviceSlaIncident.count({
      where: { tenantId, status: OPEN, severity: WARN, servicePackageId: { in: pkgIds } },
    })
    const openBreachCount = await tx.serviceSlaIncident.count({
      where: { tenantId, status: OPEN, severity: BREACH, servicePackageId: { in: pkgIds } },
    })

    const list = await tx.serviceSlaIncident.findMany({
      where: {
        tenantId,
        servicePackageId: { in: pkgIds },
        status: { in: [...ACTIVE_INCIDENT] },
      },
      orderBy: { detectedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        servicePackageId: true,
        projectId: true,
        sourceType: true,
        sourceId: true,
        severity: true,
        status: true,
        title: true,
        detail: true,
        detectedAt: true,
      },
    })

    const rank = (s: string) => (s === BREACH ? 0 : 1)
    list.sort((a, b) => rank(a.severity) - rank(b.severity) || b.detectedAt.getTime() - a.detectedAt.getTime())

    return {
      openWarnCount,
      openBreachCount,
      openIncidents: list.slice(0, 25).map((r) => ({
        ...r,
        detectedAt: r.detectedAt.toISOString(),
      })),
    }
  })
}
