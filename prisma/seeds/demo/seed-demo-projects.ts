/**
 * Demo / sample data for the Projects module (non-destructive).
 * Uses stable IDs so re-runs upsert the same rows — no deleteMany, no wipe of other data.
 */

import { PrismaClient } from '@prisma/client'
import { DEMO_DATE_RANGE } from './date-utils'

const SEED_PREFIX = 'demo_seed_proj'

interface DemoProjectRow {
  id: string
  code: string
  name: string
  description: string
  status: string
  priority: string
  progress: number
  budget: number
  actualCost: number
  monthsAgoCreated: number
  actualStartDate?: Date
  actualEndDate?: Date
}

/** Stable primary keys for idempotent upserts */
const DEMO_PROJECTS: DemoProjectRow[] = [
  {
    id: `${SEED_PREFIX}_001`,
    code: 'DEMO-PRJ-001',
    name: 'Website redesign & launch',
    description: 'Marketing site refresh, CMS migration, and launch checklist.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    progress: 62,
    budget: 520000,
    actualCost: 210000,
    monthsAgoCreated: 5,
  },
  {
    id: `${SEED_PREFIX}_002`,
    code: 'DEMO-PRJ-002',
    name: 'Mobile app — customer self-service',
    description: 'iOS/Android app for account management and support tickets.',
    status: 'PLANNING',
    priority: 'URGENT',
    progress: 18,
    budget: 890000,
    actualCost: 45000,
    monthsAgoCreated: 4,
  },
  {
    id: `${SEED_PREFIX}_003`,
    code: 'DEMO-PRJ-003',
    name: 'Q1 digital marketing rollout',
    description: 'Paid social, landing pages, and attribution dashboards.',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    progress: 100,
    budget: 240000,
    actualCost: 228000,
    monthsAgoCreated: 3,
    actualStartDate: new Date('2025-11-01T00:00:00.000Z'),
    actualEndDate: new Date('2026-01-20T00:00:00.000Z'),
  },
  {
    id: `${SEED_PREFIX}_004`,
    code: 'DEMO-PRJ-004',
    name: 'ERP ↔ CRM integration',
    description: 'Sync orders, invoices, and inventory with the finance stack.',
    status: 'ON_HOLD',
    priority: 'MEDIUM',
    progress: 34,
    budget: 1150000,
    actualCost: 310000,
    monthsAgoCreated: 2,
  },
  {
    id: `${SEED_PREFIX}_005`,
    code: 'DEMO-PRJ-005',
    name: 'Customer success portal',
    description: 'Knowledge base, onboarding flows, and health scores.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    progress: 48,
    budget: 380000,
    actualCost: 142000,
    monthsAgoCreated: 1,
  },
]

function createdAtMonthsAgo(monthsAgo: number, anchor: Date): Date {
  const d = new Date(anchor)
  d.setMonth(d.getMonth() - monthsAgo)
  if (d < DEMO_DATE_RANGE.start) return new Date(DEMO_DATE_RANGE.start)
  if (d > DEMO_DATE_RANGE.end) return new Date(DEMO_DATE_RANGE.end)
  return d
}

export interface DemoProjectsSampleSeedResult {
  projects: number
  tasks: number
  timeEntries: number
  members: number
}

/**
 * Upsert sample projects, tasks, members, and time entries for a tenant.
 * Safe to run on production-like demo tenants: only touches rows with ids under demo_seed_proj_* / demo_seed_ptask_* / demo_seed_ptime_*.
 */
export async function ensureDemoProjectsSampleData(
  prisma: PrismaClient,
  tenantId: string
): Promise<DemoProjectsSampleSeedResult> {
  const users = await prisma.user.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
    take: 12,
    select: { id: true },
  })
  if (users.length === 0) {
    console.warn('[seed-demo-projects] No users for tenant; skipping projects sample seed.')
    return { projects: 0, tasks: 0, timeEntries: 0, members: 0 }
  }

  const ownerId =
    (
      await prisma.user.findFirst({
        where: { tenantId, email: 'admin@demo.com' },
        select: { id: true },
      })
    )?.id ?? users[0].id

  const client = await prisma.contact.findFirst({
    where: { tenantId },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })
  const clientId = client?.id ?? null

  const anchor = new Date()
  let projectCount = 0
  let taskCount = 0
  let memberCount = 0
  let timeCount = 0

  const taskBlueprints: Array<{
    name: string
    description: string
    status: string
    priority: string
  }> = [
    { name: 'Discovery & requirements', description: 'Stakeholder workshops and scope sign-off.', status: 'COMPLETED', priority: 'HIGH' },
    { name: 'Design system & wireframes', description: 'UI kit and responsive layouts.', status: 'IN_PROGRESS', priority: 'HIGH' },
    { name: 'Implementation sprint 1', description: 'Core flows and integrations.', status: 'TODO', priority: 'MEDIUM' },
    { name: 'QA & UAT', description: 'Regression, accessibility, and sign-off.', status: 'TODO', priority: 'MEDIUM' },
  ]

  for (const p of DEMO_PROJECTS) {
    const createdAt = createdAtMonthsAgo(p.monthsAgoCreated, anchor)
    const startDate = new Date(createdAt)
    const endDate = new Date(startDate.getTime() + 120 * 24 * 60 * 60 * 1000)

    await prisma.project.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        tenantId,
        name: p.name,
        description: p.description,
        code: p.code,
        status: p.status,
        priority: p.priority,
        progress: p.progress,
        budget: p.budget,
        actualCost: p.actualCost,
        startDate,
        endDate,
        actualStartDate: p.actualStartDate ?? null,
        actualEndDate: p.actualEndDate ?? null,
        ownerId,
        clientId,
        tags: ['demo', 'sample'],
        notes: 'Seeded sample project for module tour (idempotent).',
        createdAt,
      },
      update: {
        tenantId,
        name: p.name,
        description: p.description,
        code: p.code,
        status: p.status,
        priority: p.priority,
        progress: p.progress,
        budget: p.budget,
        actualCost: p.actualCost,
        startDate,
        endDate,
        actualStartDate: p.actualStartDate ?? null,
        actualEndDate: p.actualEndDate ?? null,
        ownerId,
        clientId,
        tags: ['demo', 'sample'],
        notes: 'Seeded sample project for module tour (idempotent).',
      },
    })
    projectCount++

    const memberIds = Array.from(new Set([ownerId, ...users.map((u) => u.id)])).slice(0, 3)
    const roles = ['PROJECT_MANAGER', 'DEVELOPER', 'DESIGNER'] as const
    for (let mi = 0; mi < memberIds.length; mi++) {
      const uid = memberIds[mi]
      await prisma.projectMember.upsert({
        where: {
          projectId_userId: { projectId: p.id, userId: uid },
        },
        create: {
          projectId: p.id,
          userId: uid,
          role: roles[mi % roles.length],
          allocationPercentage: 100,
        },
        update: {
          role: roles[mi % roles.length],
          allocationPercentage: 100,
        },
      })
      memberCount++
    }

    for (let ti = 0; ti < taskBlueprints.length; ti++) {
      const tb = taskBlueprints[ti]
      const taskId = `${p.id}_task_${ti + 1}`
      const assignee = users[ti % users.length].id
      const due = new Date(anchor)
      due.setDate(due.getDate() + 7 * (ti + 1))

      await prisma.projectTask.upsert({
        where: { id: taskId },
        create: {
          id: taskId,
          projectId: p.id,
          name: tb.name,
          description: `${tb.description} (${p.name})`,
          status: tb.status,
          priority: tb.priority,
          assignedToId: assignee,
          dueDate: due,
          completedAt: tb.status === 'COMPLETED' ? new Date(anchor.getTime() - 86400000 * (ti + 1)) : null,
          progress: tb.status === 'COMPLETED' ? 100 : tb.status === 'IN_PROGRESS' ? 40 : 0,
        },
        update: {
          name: tb.name,
          description: `${tb.description} (${p.name})`,
          status: tb.status,
          priority: tb.priority,
          assignedToId: assignee,
          dueDate: due,
          completedAt: tb.status === 'COMPLETED' ? new Date(anchor.getTime() - 86400000 * (ti + 1)) : null,
          progress: tb.status === 'COMPLETED' ? 100 : tb.status === 'IN_PROGRESS' ? 40 : 0,
        },
      })
      taskCount++
    }
  }

  // Time entries in the current calendar month (dashboard aggregates this month only)
  const projectIds = DEMO_PROJECTS.map((x) => x.id)
  const teUsers = users.slice(0, 4)
  const hoursList = [2.5, 3, 1.5, 4, 2, 3.5]
  for (let i = 0; i < hoursList.length; i++) {
    const projectId = projectIds[i % projectIds.length]
    const taskId = `${projectId}_task_${(i % 4) + 1}`
    const userId = teUsers[i % teUsers.length].id
    const teId = `demo_seed_ptime_${String(i + 1).padStart(3, '0')}`
    const day = Math.min(28, 3 + i * 4)
    const entryDate = new Date(anchor.getFullYear(), anchor.getMonth(), day, 12, 0, 0, 0)

    await prisma.timeEntry.upsert({
      where: { id: teId },
      create: {
        id: teId,
        projectId,
        taskId,
        userId,
        date: entryDate,
        hours: hoursList[i],
        description: 'Demo time entry for dashboard totals',
        billable: i % 2 === 0,
        billingRate: i % 2 === 0 ? 2500 : null,
      },
      update: {
        projectId,
        taskId,
        userId,
        date: entryDate,
        hours: hoursList[i],
        description: 'Demo time entry for dashboard totals',
        billable: i % 2 === 0,
        billingRate: i % 2 === 0 ? 2500 : null,
      },
    })
    timeCount++
  }

  return {
    projects: projectCount,
    tasks: taskCount,
    timeEntries: timeCount,
    members: memberCount,
  }
}

async function runCli() {
  const prisma = new PrismaClient()
  try {
    const fromEnv = process.env.TENANT_ID?.trim()
    const tenant = fromEnv
      ? await prisma.tenant.findUnique({ where: { id: fromEnv } })
      : await prisma.tenant.findFirst({ where: { subdomain: 'demo' } })
    if (!tenant) {
      console.error('[seed-demo-projects] No tenant found (subdomain demo or TENANT_ID).')
      process.exit(1)
    }
    const r = await ensureDemoProjectsSampleData(prisma, tenant.id)
    console.log('[seed-demo-projects] Done:', r)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  runCli().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
