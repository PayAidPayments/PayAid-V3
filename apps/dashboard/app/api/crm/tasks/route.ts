import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { resolveCrmRequestTenantId } from '@/lib/crm/resolve-crm-request-tenant'
import { buildTasksListWhere, utcDayBounds } from '@/lib/crm/tasks-list-where'
import {
  buildTasksListCacheKey,
  invalidateTasksListCache,
  TASKS_LIST_CACHE_TTL_SEC,
} from '@/lib/crm/tasks-list-cache'
import { multiLayerCache } from '@/lib/cache/multi-layer'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  dueDate: z.string().datetime().optional(),
  contactId: z.string().optional(),
  assignedToId: z.string().optional(),
  recurrenceRule: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  recurrenceEndDate: z.string().datetime().optional(),
})

const taskInclude = {
  contact: { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
} as const

const taskFallbackSelect = {
  id: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  dueDate: true,
  completedAt: true,
  reminderSentAt: true,
  module: true,
  recurrenceRule: true,
  recurrenceEndDate: true,
  createdAt: true,
  updatedAt: true,
  tenantId: true,
  contactId: true,
  assignedToId: true,
} as const

async function fetchTaskListPayload(
  where: Record<string, unknown>,
  tenantId: string,
  page: number,
  limit: number,
  wantStats: boolean
) {
  const skip = Math.max(0, page - 1) * limit
  const take = Math.max(1, Math.min(limit, 1000))
  try {
    const [tasks, total, openCount, overdueCount, completedTodayCount] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: [{ priority: 'desc' as const }, { dueDate: 'asc' as const }],
        include: taskInclude,
      }),
      prisma.task.count({ where }),
      wantStats
        ? prisma.task.count({
            where: {
              tenantId,
              NOT: { status: { in: ['completed', 'cancelled'] } },
            },
          })
        : Promise.resolve(0),
      wantStats
        ? (() => {
            const { start } = utcDayBounds()
            return prisma.task.count({
              where: {
                tenantId,
                NOT: { status: { in: ['completed', 'cancelled'] } },
                dueDate: { not: null, lt: start },
              },
            })
          })()
        : Promise.resolve(0),
      wantStats
        ? (() => {
            const { start, end } = utcDayBounds()
            return prisma.task.count({
              where: {
                tenantId,
                status: 'completed',
                completedAt: { gte: start, lte: end },
              },
            })
          })()
        : Promise.resolve(0),
    ])
    return { tasks, total, openCount, overdueCount, completedTodayCount }
  } catch (primaryError) {
    console.warn('[CRM API] Primary task query failed, using fallback list payload:', primaryError)
    const [rawTasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: [{ updatedAt: 'desc' as const }],
        select: taskFallbackSelect,
      }),
      prisma.task.count({ where }),
    ])

    const contactIds = Array.from(
      new Set(rawTasks.map((task) => task.contactId).filter((id): id is string => Boolean(id)))
    )
    const assignedUserIds = Array.from(
      new Set(rawTasks.map((task) => task.assignedToId).filter((id): id is string => Boolean(id)))
    )

    const [contacts, assignedUsers] = await Promise.all([
      contactIds.length
        ? prisma.contact.findMany({
            where: { tenantId, id: { in: contactIds } },
            select: { id: true, name: true, email: true },
          })
        : Promise.resolve([]),
      assignedUserIds.length
        ? prisma.user.findMany({
            where: { tenantId, id: { in: assignedUserIds } },
            select: { id: true, name: true, email: true },
          })
        : Promise.resolve([]),
    ])

    const contactsById = new Map(contacts.map((contact) => [contact.id, contact]))
    const assignedUsersById = new Map(assignedUsers.map((user) => [user.id, user]))
    const tasks = rawTasks.map((task) => ({
      ...task,
      contact: task.contactId ? (contactsById.get(task.contactId) ?? null) : null,
      assignedTo: task.assignedToId ? (assignedUsersById.get(task.assignedToId) ?? null) : null,
    }))

    return {
      tasks,
      total,
      openCount: 0,
      overdueCount: 0,
      completedTodayCount: 0,
    }
  }
}

// GET /api/crm/tasks — native task list for CRM surfaces
export async function GET(request: NextRequest) {
  try {
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)
    const sp = request.nextUrl.searchParams

    const page = parseInt(sp.get('page') || '1', 10)
    const limit = parseInt(sp.get('limit') || '50', 10)
    const wantStats = sp.get('stats') !== 'false'
    const bypassCache = sp.get('bypassCache') === 'true'
    const cacheKey = bypassCache ? null : buildTasksListCacheKey(tenantId, sp, page, limit, wantStats)

    if (cacheKey) {
      try {
        const cached = await multiLayerCache.get(cacheKey)
        if (cached) {
          return NextResponse.json(cached)
        }
      } catch (cacheError) {
        console.warn('[CRM API] Tasks cache get error (continuing):', cacheError)
      }
    }

    const where = buildTasksListWhere(tenantId, sp)

    const { tasks, total, openCount, overdueCount, completedTodayCount } = await fetchTaskListPayload(
      where,
      tenantId,
      page,
      limit,
      wantStats
    )

    const payload = {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: wantStats ? { openCount, overdueCount, completedTodayCount } : undefined,
    }

    if (cacheKey) {
      try {
        await multiLayerCache.set(cacheKey, payload, TASKS_LIST_CACHE_TTL_SEC)
      } catch (cacheError) {
        console.warn('[CRM API] Tasks cache set error (continuing):', cacheError)
      }
    }

    return NextResponse.json(payload)
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('[CRM API] Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to get tasks' }, { status: 500 })
  }
}

// POST /api/crm/tasks — native task create for CRM surfaces
export async function POST(request: NextRequest) {
  try {
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)

    const body = await request.json()
    const validated = createTaskSchema.parse(body)

    if (validated.contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: validated.contactId, tenantId },
      })
      if (!contact) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      }
    }

    if (validated.assignedToId) {
      const assignedUser = await prisma.user.findFirst({
        where: { id: validated.assignedToId, tenantId },
      })
      if (!assignedUser) {
        return NextResponse.json({ error: 'Assigned user not found' }, { status: 404 })
      }
    }

    const task = await prisma.task.create({
      data: {
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        status: validated.status,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        contactId: validated.contactId,
        assignedToId: validated.assignedToId || userId,
        tenantId,
        module: 'crm',
        ...(validated.recurrenceRule != null ? { recurrenceRule: validated.recurrenceRule } : {}),
        ...(validated.recurrenceEndDate
          ? { recurrenceEndDate: new Date(validated.recurrenceEndDate) }
          : {}),
      },
      include: taskInclude,
    })

    await invalidateTasksListCache(tenantId)

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('[CRM API] Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

