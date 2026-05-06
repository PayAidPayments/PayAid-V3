import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { seedOperationalTasksFromProfileMetadata } from '@/lib/api/projects/project-profile-automation'
import {
  MILESTONE_APPROVAL_RUNTIME_TAG_PREFIX,
  MILESTONE_APPROVAL_SCRIPT_BASE_TAG,
  ensureMilestoneApprovalChecklistTask,
} from '@/lib/api/projects/milestone-approval-scripting'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const patchProjectSchema = z
  .object({
    health: z.union([z.enum(['GREEN', 'AMBER', 'RED']), z.null()]).optional(),
    billingModel: z.union([z.string().min(1).max(120), z.null()]).optional(),
    currency: z.string().min(3).max(8).optional(),
    deliveryType: z.union([z.string().min(1).max(120), z.null()]).optional(),
    serviceCategory: z.union([z.string().min(1).max(200), z.null()]).optional(),
    billingIsInterState: z.union([z.boolean(), z.null()]).optional(),
    status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
    progress: z.number().int().min(0).max(100).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    name: z.string().min(1).max(200).optional(),
    description: z.union([z.string().max(20000), z.null()]).optional(),
    notes: z.union([z.string().max(50000), z.null()]).optional(),
    /** When true: re-run profile-metadata operational task seeding from current notes (idempotent tags). */
    resyncProfileAutomation: z.boolean().optional(),
    /** When true: ensure approval checklist tasks exist for ON_APPROVE + approvalRequired milestones. */
    resyncMilestoneApprovalChecklists: z.boolean().optional(),
    servicePackageId: z.union([z.string().min(1), z.null()]).optional(),
  })
  .strict()

const patchProjectRowSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  progress: true,
  priority: true,
  health: true,
  billingModel: true,
  currency: true,
  deliveryType: true,
  serviceCategory: true,
  billingIsInterState: true,
  servicePackageId: true,
  notes: true,
  ownerId: true,
} as const

// GET /api/projects/[id] — single project for detail UI (tasks, team, time)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId } = await requireModuleAccess(request, 'projects')

    const project = await prisma.project.findFirst({
      where: { id, tenantId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, name: true, stage: true } },
        servicePackage: {
          select: {
            id: true,
            name: true,
            billingType: true,
            monthlyHours: true,
            sla: true,
            slaPolicy: true,
            renewalDate: true,
            status: true,
            clientId: true,
          },
        },
        tasks: {
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            assignedToId: true,
            dueDate: true,
            progress: true,
            phaseId: true,
            milestoneId: true,
            phase: { select: { id: true, name: true } },
            milestone: { select: { id: true, name: true } },
          },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        timeEntries: {
          orderBy: { date: 'desc' },
          take: 150,
          include: {
            user: { select: { id: true, name: true, email: true } },
            task: { select: { id: true, name: true } },
          },
        },
        phases: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            sortOrder: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        milestones: {
          orderBy: [{ dueDate: 'asc' }, { sortOrder: 'asc' }],
          select: {
            id: true,
            phaseId: true,
            name: true,
            dueDate: true,
            status: true,
            approvalRequired: true,
            approvedAt: true,
            approvedById: true,
            billingDraftInvoiceId: true,
            billingTrigger: true,
            sortOrder: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const approvalChecklistTasks = await prisma.projectTask.findMany({
      where: {
        projectId: project.id,
        tags: { has: MILESTONE_APPROVAL_SCRIPT_BASE_TAG },
      },
      select: { tags: true },
    })
    const approvalChecklistMilestoneIds = new Set<string>()
    for (const t of approvalChecklistTasks) {
      for (const tag of t.tags || []) {
        if (tag.startsWith(MILESTONE_APPROVAL_RUNTIME_TAG_PREFIX)) {
          const milestoneId = tag.slice(MILESTONE_APPROVAL_RUNTIME_TAG_PREFIX.length).trim()
          if (milestoneId) approvalChecklistMilestoneIds.add(milestoneId)
        }
      }
    }

    const totalHours = project.timeEntries.reduce((s, e) => s + Number(e.hours), 0)

    const pkg = project.servicePackage
    return NextResponse.json({
      ...project,
      servicePackage: pkg
        ? {
            ...pkg,
            monthlyHours:
              pkg.monthlyHours !== null && pkg.monthlyHours !== undefined
                ? Number(pkg.monthlyHours)
                : null,
          }
        : null,
      budget: project.budget != null ? Number(project.budget) : undefined,
      actualCost: Number(project.actualCost),
      totalHours,
      timeEntries: project.timeEntries.map((e) => ({
        ...e,
        hours: Number(e.hours),
        approvalStatus: e.approvalStatus,
        source: e.source,
        isAdhoc: e.isAdhoc,
      })),
      milestones: project.milestones.map((m) => ({
        ...m,
        approvalChecklistTaskExists: approvalChecklistMilestoneIds.has(m.id),
      })),
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('GET project error:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

// PATCH /api/projects/[id] — delivery/portfolio fields + status, progress, priority, name, description
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId, userId } = await requireModuleAccess(request, 'projects')

    const existing = await prisma.project.findFirst({
      where: { id, tenantId },
      select: {
        ...patchProjectRowSelect,
        clientId: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = patchProjectSchema.parse(body)

    const fieldKeys = Object.keys(validated).filter(
      (k) => k !== 'resyncProfileAutomation' && k !== 'resyncMilestoneApprovalChecklists'
    )
    const wantsProfileResyncOnly = validated.resyncProfileAutomation === true
    const wantsApprovalChecklistResyncOnly = validated.resyncMilestoneApprovalChecklists === true
    const hasFieldPatches = fieldKeys.length > 0

    if (!hasFieldPatches && !wantsProfileResyncOnly && !wantsApprovalChecklistResyncOnly) {
      return NextResponse.json(
        {
          error:
            'Provide at least one updatable field, notes, resyncProfileAutomation, or resyncMilestoneApprovalChecklists',
        },
        { status: 400 }
      )
    }

    const shouldSeedProfileAutomation =
      validated.notes !== undefined || validated.resyncProfileAutomation === true
    const shouldResyncMilestoneApprovalChecklists =
      validated.resyncMilestoneApprovalChecklists === true

    const data: Record<string, unknown> = {}
    if (validated.health !== undefined) data.health = validated.health
    if (validated.billingModel !== undefined) data.billingModel = validated.billingModel
    if (validated.currency !== undefined) data.currency = validated.currency
    if (validated.deliveryType !== undefined) data.deliveryType = validated.deliveryType
    if (validated.serviceCategory !== undefined) data.serviceCategory = validated.serviceCategory
    if (validated.billingIsInterState !== undefined) data.billingIsInterState = validated.billingIsInterState
    if (validated.status !== undefined) data.status = validated.status
    if (validated.progress !== undefined) data.progress = validated.progress
    if (validated.priority !== undefined) data.priority = validated.priority
    if (validated.name !== undefined) data.name = validated.name
    if (validated.description !== undefined) data.description = validated.description
    if (validated.notes !== undefined) data.notes = validated.notes

    if (validated.servicePackageId !== undefined) {
      if (validated.servicePackageId === null) {
        data.servicePackageId = null
      } else {
        const pkg = await prisma.servicePackage.findFirst({
          where: { id: validated.servicePackageId, tenantId },
          select: { id: true, clientId: true },
        })
        if (!pkg) {
          return NextResponse.json({ error: 'Service package not found' }, { status: 400 })
        }
        if (existing.clientId && pkg.clientId !== existing.clientId) {
          return NextResponse.json(
            { error: 'Service package must belong to the same client as the project' },
            { status: 400 }
          )
        }
        data.servicePackageId = validated.servicePackageId
      }
    }

    const txResult = await prisma.$transaction(async (tx) => {
      const row =
        Object.keys(data).length > 0
          ? await tx.project.update({
              where: { id },
              data: data as Parameters<typeof tx.project.update>[0]['data'],
              select: patchProjectRowSelect,
            })
          : await tx.project.findFirst({
              where: { id, tenantId },
              select: patchProjectRowSelect,
            })

      if (!row) {
        throw new Error('PROJECT_ROW_MISSING')
      }

      let profileAutomationTasksSeeded = 0
      if (shouldSeedProfileAutomation) {
        profileAutomationTasksSeeded = await seedOperationalTasksFromProfileMetadata(tx, {
          projectId: id,
          ownerId: row.ownerId ?? null,
          notes: row.notes,
        })
      }
      let approvalChecklistTasksSeeded = 0
      if (shouldResyncMilestoneApprovalChecklists) {
        const milestones = await tx.projectMilestone.findMany({
          where: {
            projectId: id,
            billingTrigger: 'ON_APPROVE',
            approvalRequired: true,
          },
          select: { id: true, name: true, dueDate: true, billingTrigger: true, approvalRequired: true },
        })
        for (const m of milestones) {
          const out = await ensureMilestoneApprovalChecklistTask(tx, {
            projectId: id,
            milestoneId: m.id,
            milestoneName: m.name,
            dueDate: m.dueDate,
            billingTrigger: m.billingTrigger,
            approvalRequired: m.approvalRequired,
            assigneeUserId: row.ownerId ?? null,
          })
          if (out.created) approvalChecklistTasksSeeded += 1
        }
      }

      const mergedAfter = {
        ...row,
        ...(shouldSeedProfileAutomation ? { profileAutomationTasksSeeded } : {}),
        ...(shouldResyncMilestoneApprovalChecklists ? { approvalChecklistTasksSeeded } : {}),
      }

      let changeSummary = `Project updated: ${row.name}`
      if (!hasFieldPatches && wantsProfileResyncOnly && !wantsApprovalChecklistResyncOnly) {
        changeSummary = `Project profile automation re-synced: ${row.name}`
      } else if (!hasFieldPatches && wantsApprovalChecklistResyncOnly && !wantsProfileResyncOnly) {
        changeSummary = `Project milestone approval checklists re-synced: ${row.name}`
      } else if (shouldSeedProfileAutomation && profileAutomationTasksSeeded > 0) {
        changeSummary = `Project updated: ${row.name} (+${profileAutomationTasksSeeded} profile automation task(s))`
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          entityType: 'projects_project',
          entityId: id,
          changedBy: userId,
          changeSummary,
          beforeSnapshot: { ...existing },
          afterSnapshot: mergedAfter,
        },
      })

      return {
        row,
        profileAutomationTasksSeeded: shouldSeedProfileAutomation ? profileAutomationTasksSeeded : undefined,
        approvalChecklistTasksSeeded: shouldResyncMilestoneApprovalChecklists
          ? approvalChecklistTasksSeeded
          : undefined,
      }
    })

    return NextResponse.json({
      project: txResult.row,
      ...(typeof txResult.profileAutomationTasksSeeded === 'number'
        ? { profileAutomationTasksSeeded: txResult.profileAutomationTasksSeeded }
        : {}),
      ...(typeof txResult.approvalChecklistTasksSeeded === 'number'
        ? { approvalChecklistTasksSeeded: txResult.approvalChecklistTasksSeeded }
        : {}),
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'PROJECT_ROW_MISSING') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    console.error('PATCH project error:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}
