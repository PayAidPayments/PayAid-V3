import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { resolveCrmRequestTenantId } from '@/lib/crm/resolve-crm-request-tenant'
import { buildTasksListWhere, utcDayBounds } from '@/lib/crm/tasks-list-where'
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

// GET /api/tasks — list (tenant from JWT + optional ?tenantId= CRM context)
export async function GET(request: NextRequest) {
  try {
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)
    const sp = request.nextUrl.searchParams

    const page = parseInt(sp.get('page') || '1', 10)
    const limit = parseInt(sp.get('limit') || '50', 10)
    const wantStats = sp.get('stats') !== 'false'

    const where = buildTasksListWhere(tenantId, sp)

    const [tasks, total, openCount, overdueCount, completedTodayCount] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: Math.max(0, page - 1) * limit,
        take: limit,
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

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: wantStats
        ? { openCount, overdueCount, completedTodayCount }
        : undefined,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get tasks error:', error)
    return NextResponse.json({ error: 'Failed to get tasks' }, { status: 500 })
  }
}

// POST /api/tasks
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

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
