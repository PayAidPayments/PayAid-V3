import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { validateOverageRulesInput } from './overage-rules'
import { validateSlaPolicyInput } from '@/lib/api/projects/service-package-sla-policy'
import { reconcileDeliverySlaIncidents } from '@/lib/api/projects/service-sla-reconcile'

export const packSelect = Prisma.validator<Prisma.ServicePackageSelect>()({
  id: true,
  tenantId: true,
  clientId: true,
  name: true,
  billingType: true,
  monthlyHours: true,
  sla: true,
  slaPolicy: true,
  renewalDate: true,
  overageRules: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  client: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  _count: { select: { projects: true } },
})

export type ServicePackageListItem = Prisma.ServicePackageGetPayload<{ select: typeof packSelect }>

const createPackageSchema = z.object({
  name: z.string().min(1).max(240),
  clientId: z.string().min(1),
  billingType: z.string().min(1).max(120).optional(),
  monthlyHours: z.number().nonnegative().optional(),
  sla: z.string().max(4000).optional().nullable(),
  slaPolicy: z.unknown().optional().nullable(),
  renewalDate: z.string().datetime().optional().nullable(),
  overageRules: z.unknown().optional().nullable(),
  status: z.string().min(1).max(40).optional(),
  notes: z.string().max(8000).optional().nullable(),
})

function serializePackage(row: ServicePackageListItem) {
  return {
    ...row,
    monthlyHours:
      row.monthlyHours !== null && row.monthlyHours !== undefined ? Number(row.monthlyHours) : null,
    projectCount: row._count.projects,
    _count: undefined,
  }
}

function currentMonthWindow() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { start, end }
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

type CapacityPolicy = {
  warnUtilizationPercent: number
  breachUtilizationPercent: number
  projectedWarnUtilizationPercent: number
  source: 'defaults' | 'overageRules'
}

function asFinitePercent(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value < 1 || value > 500) return null
  return value
}

function resolveCapacityPolicy(overageRules: unknown): CapacityPolicy {
  const defaults: CapacityPolicy = {
    warnUtilizationPercent: 90,
    breachUtilizationPercent: 100,
    projectedWarnUtilizationPercent: 95,
    source: 'defaults',
  }
  if (!overageRules || typeof overageRules !== 'object' || Array.isArray(overageRules)) {
    return defaults
  }
  const ruleObj = overageRules as Record<string, unknown>
  const warn = asFinitePercent(ruleObj.warnUtilizationPercent)
  const breach = asFinitePercent(ruleObj.breachUtilizationPercent)
  const projectedWarn = asFinitePercent(ruleObj.projectedWarnUtilizationPercent)

  const merged = {
    warnUtilizationPercent: warn ?? defaults.warnUtilizationPercent,
    breachUtilizationPercent: breach ?? defaults.breachUtilizationPercent,
    projectedWarnUtilizationPercent: projectedWarn ?? defaults.projectedWarnUtilizationPercent,
  }
  // Keep thresholds monotonic to avoid contradictory states.
  const warnClamped = Math.min(merged.warnUtilizationPercent, merged.breachUtilizationPercent)
  const projectedClamped = Math.min(merged.projectedWarnUtilizationPercent, merged.breachUtilizationPercent)
  return {
    warnUtilizationPercent: warnClamped,
    breachUtilizationPercent: merged.breachUtilizationPercent,
    projectedWarnUtilizationPercent: projectedClamped,
    source: 'overageRules',
  }
}

/** GET — list tenant service packages */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'projects')
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')

    const rows = await prisma.servicePackage.findMany({
      where: {
        tenantId,
        ...(clientId ? { clientId } : {}),
        ...(status ? { status } : {}),
      },
      select: packSelect,
      orderBy: { updatedAt: 'desc' },
    })

    const packageIds = rows.map((r) => r.id)
    const monthHoursByPackageId = new Map<string, number>()
    if (packageIds.length > 0) {
      const { start, end } = currentMonthWindow()
      const monthlyRollups = await prisma.timeEntry.groupBy({
        by: ['projectId'],
        where: {
          approvalStatus: 'APPROVED',
          date: { gte: start, lt: end },
          project: {
            tenantId,
            servicePackageId: { in: packageIds },
          },
        },
        _sum: { hours: true },
      })

      const projectToPackage = await prisma.project.findMany({
        where: {
          tenantId,
          servicePackageId: { in: packageIds },
        },
        select: { id: true, servicePackageId: true },
      })
      const map = new Map(projectToPackage.map((p) => [p.id, p.servicePackageId]))

      for (const row of monthlyRollups) {
        const pkgId = map.get(row.projectId)
        if (!pkgId) continue
        const hours = Number(row._sum.hours ?? 0)
        monthHoursByPackageId.set(pkgId, (monthHoursByPackageId.get(pkgId) ?? 0) + hours)
      }
    }

    const { start, end } = currentMonthWindow()
    const elapsedMs = Date.now() - start.getTime()
    const totalMs = end.getTime() - start.getTime()
    const elapsedRatio = totalMs > 0 ? Math.max(0.03, Math.min(1, elapsedMs / totalMs)) : 1

    const enrichedPackages = rows.map((r) => {
      const base = serializePackage(r)
      const monthApprovedHours = monthHoursByPackageId.get(r.id) ?? 0
      const projectedMonthEndHours = round2(monthApprovedHours / elapsedRatio)
      const utilizationPercent =
        base.monthlyHours && base.monthlyHours > 0
          ? Math.round((monthApprovedHours / base.monthlyHours) * 100)
          : null
      const projectedUtilizationPercent =
        base.monthlyHours && base.monthlyHours > 0
          ? Math.round((projectedMonthEndHours / base.monthlyHours) * 100)
          : null
      const policy = resolveCapacityPolicy(base.overageRules)
      const capacitySignal =
        base.monthlyHours && base.monthlyHours > 0 && utilizationPercent !== null
          ? utilizationPercent >= policy.breachUtilizationPercent
            ? 'BREACHED'
            : projectedUtilizationPercent !== null &&
                projectedUtilizationPercent >= policy.projectedWarnUtilizationPercent
              ? 'AT_RISK'
              : utilizationPercent >= policy.warnUtilizationPercent
                ? 'AT_RISK'
                : 'ON_TRACK'
          : 'UNTRACKED'
      const capacitySignalReason =
        capacitySignal === 'BREACHED'
          ? `Current utilization ${utilizationPercent}% >= breach threshold ${policy.breachUtilizationPercent}%`
          : capacitySignal === 'AT_RISK'
            ? `Warn threshold ${policy.warnUtilizationPercent}% / projected warn ${policy.projectedWarnUtilizationPercent}%`
            : capacitySignal === 'ON_TRACK'
              ? `Below warn threshold ${policy.warnUtilizationPercent}%`
              : 'No monthlyHours set'
      return {
        ...base,
        monthApprovedHours,
        utilizationPercent,
        projectedMonthEndHours,
        projectedUtilizationPercent,
        capacitySignal,
        capacitySignalReason,
        capacityPolicy: policy,
      }
    })

    const activePackages = enrichedPackages.filter((p) => p.status === 'ACTIVE')
    const activePackageIds = activePackages.map((p) => p.id)
    const trackedPackages = activePackages.filter((p) => p.monthlyHours !== null && p.monthlyHours > 0)
    const breachedPackages = activePackages.filter((p) => p.capacitySignal === 'BREACHED')
    const atRiskPackages = activePackages.filter((p) => p.capacitySignal === 'AT_RISK')
    const onTrackPackages = activePackages.filter((p) => p.capacitySignal === 'ON_TRACK')
    const untrackedPackages = activePackages.filter((p) => p.capacitySignal === 'UNTRACKED')
    const slaConfiguredPackages = activePackages.filter((p) => !!p.sla && p.sla.trim().length > 0)
    const renewalCutoff = new Date()
    renewalCutoff.setDate(renewalCutoff.getDate() + 30)
    const renewalsDueIn30Days = activePackages.filter((p) => {
      if (!p.renewalDate) return false
      const renewalAt = new Date(p.renewalDate)
      return Number.isFinite(renewalAt.getTime()) && renewalAt >= new Date() && renewalAt <= renewalCutoff
    })
    const totalMonthlyHours = round2(
      trackedPackages.reduce((sum, p) => sum + (p.monthlyHours && p.monthlyHours > 0 ? p.monthlyHours : 0), 0)
    )
    const totalApprovedHoursMonth = round2(
      trackedPackages.reduce((sum, p) => sum + (p.monthApprovedHours || 0), 0)
    )
    const totalProjectedHoursMonth = round2(
      trackedPackages.reduce((sum, p) => sum + (p.projectedMonthEndHours || 0), 0)
    )
    const utilizationPercentRollup =
      totalMonthlyHours > 0 ? Math.round((totalApprovedHoursMonth / totalMonthlyHours) * 100) : null
    const projectedUtilizationPercentRollup =
      totalMonthlyHours > 0 ? Math.round((totalProjectedHoursMonth / totalMonthlyHours) * 100) : null
    const slaReconcile = await reconcileDeliverySlaIncidents(prisma, tenantId, rows)
    const now = new Date()
    const overdueMilestones =
      activePackageIds.length > 0
        ? await prisma.projectMilestone.count({
            where: {
              dueDate: { lt: now },
              status: { not: 'MET' },
              project: {
                tenantId,
                servicePackageId: { in: activePackageIds },
              },
            },
          })
        : 0
    const overdueTasks =
      activePackageIds.length > 0
        ? await prisma.projectTask.count({
            where: {
              dueDate: { lt: now },
              status: { notIn: ['DONE', 'COMPLETED', 'CANCELLED'] },
              project: {
                tenantId,
                servicePackageId: { in: activePackageIds },
              },
            },
          })
        : 0

    return NextResponse.json({
      packages: enrichedPackages,
      summary: {
        activePackages: activePackages.length,
        trackedPackages: trackedPackages.length,
        breachedPackages: breachedPackages.length,
        atRiskPackages: atRiskPackages.length,
        onTrackPackages: onTrackPackages.length,
        untrackedPackages: untrackedPackages.length,
        slaConfiguredPackages: slaConfiguredPackages.length,
        renewalsDueIn30Days: renewalsDueIn30Days.length,
        totalMonthlyHours,
        totalApprovedHoursMonth,
        totalProjectedHoursMonth,
        utilizationPercentRollup,
        projectedUtilizationPercentRollup,
        overdueMilestones,
        overdueTasks,
        slaBreachProxyTotal: overdueMilestones + overdueTasks,
        slaOpenWarnCount: slaReconcile.openWarnCount,
        slaOpenBreachCount: slaReconcile.openBreachCount,
      },
      openSlaIncidents: slaReconcile.openIncidents,
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('GET service-packages:', error)
    return NextResponse.json({ error: 'Failed to load service packages' }, { status: 500 })
  }
}

/** POST — create ServicePackage */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'projects')
    const raw = await request.json()
    const body = createPackageSchema.parse(raw)
    const slaPolicyValidation = validateSlaPolicyInput(body.slaPolicy)
    if (slaPolicyValidation.kind === 'invalid') {
      return NextResponse.json(
        {
          error: 'Invalid slaPolicy',
          details: slaPolicyValidation.issues,
          expectedKeys: [
            'trackMilestones',
            'trackTasks',
            'milestoneWarnHoursBeforeDue',
            'milestoneBreachGraceHours',
            'taskWarnHoursBeforeDue',
            'taskBreachGraceHours',
          ],
        },
        { status: 400 }
      )
    }

    const overageValidation = validateOverageRulesInput(body.overageRules)
    if (overageValidation.kind === 'invalid') {
      return NextResponse.json(
        {
          error: 'Invalid overageRules',
          details: overageValidation.issues,
          expectedKeys: [
            'warnUtilizationPercent',
            'projectedWarnUtilizationPercent',
            'breachUtilizationPercent',
          ],
        },
        { status: 400 }
      )
    }

    const contact = await prisma.contact.findFirst({
      where: { id: body.clientId, tenantId },
      select: { id: true },
    })
    if (!contact) {
      return NextResponse.json({ error: 'Client not found in this workspace' }, { status: 400 })
    }

    const row = await prisma.servicePackage.create({
      data: {
        tenantId,
        clientId: body.clientId,
        name: body.name,
        billingType: body.billingType ?? 'RETAINER',
        monthlyHours:
          body.monthlyHours !== undefined ? new Prisma.Decimal(body.monthlyHours) : null,
        sla: body.sla ?? null,
        ...(slaPolicyValidation.kind === 'clear'
          ? { slaPolicy: Prisma.JsonNull }
          : slaPolicyValidation.kind === 'valid'
            ? { slaPolicy: slaPolicyValidation.parsed as Prisma.InputJsonValue }
            : {}),
        renewalDate: body.renewalDate ? new Date(body.renewalDate) : null,
        ...(overageValidation.kind === 'clear'
          ? { overageRules: Prisma.JsonNull }
          : overageValidation.kind === 'valid'
            ? { overageRules: overageValidation.parsed as Prisma.InputJsonValue }
            : {}),
        status: body.status ?? 'ACTIVE',
        notes: body.notes ?? null,
      },
      select: packSelect,
    })

    return NextResponse.json({ package: serializePackage(row) }, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('POST service-packages:', error)
    return NextResponse.json({ error: 'Failed to create service package' }, { status: 500 })
  }
}
