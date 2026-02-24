import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
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
  module: z.string().optional(),
  recurrenceRule: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  recurrenceEndDate: z.string().datetime().optional(),
})

const OPEN_STATUSES = ['pending', 'in_progress']
const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
const endOfToday = () => {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
}

// GET /api/tasks - List all tasks (search, filters, pagination, stats)
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '25') || 25, 100)
    const status = searchParams.get('status')
    const assignedToId = searchParams.get('assignedToId')
    const contactId = searchParams.get('contactId')
    const search = searchParams.get('search')?.trim() || ''
    const module = searchParams.get('module')?.trim() || ''
    const priority = searchParams.get('priority')?.trim() || ''
    const dueDateFrom = searchParams.get('dueDateFrom')?.trim() || ''
    const dueDateTo = searchParams.get('dueDateTo')?.trim() || ''
    const includeStats = searchParams.get('stats') !== 'false'

    const cacheKey = `tasks:${tenantId}:${page}:${limit}:${status || 'all'}:${assignedToId || 'all'}:${contactId || 'all'}:${search}:${module}:${priority}:${dueDateFrom}:${dueDateTo}`

    const cached = await multiLayerCache.get(cacheKey)
    if (cached) return NextResponse.json(cached)

    const where: any = { tenantId }

    if (status) {
      if (status === 'overdue') {
        where.status = { in: OPEN_STATUSES }
        where.dueDate = { lt: startOfToday() }
      } else if (status === 'open') {
        where.status = { in: OPEN_STATUSES }
      } else {
        where.status = status
      }
    }
    if (assignedToId) where.assignedToId = assignedToId
    if (contactId) where.contactId = contactId
    if (module) where.module = module
    if (priority) where.priority = priority
    if (dueDateFrom || dueDateTo) {
      where.dueDate = {}
      if (dueDateFrom) (where.dueDate as any).gte = new Date(dueDateFrom)
      if (dueDateTo) (where.dueDate as any).lte = new Date(dueDateTo)
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { contact: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const baseWhere = { tenantId }
    const openWhere = { ...baseWhere, status: { in: OPEN_STATUSES } }
    const overdueWhere = { ...baseWhere, status: { in: OPEN_STATUSES }, dueDate: { lt: startOfToday() } }
    const completedTodayWhere = {
      ...baseWhere,
      status: 'completed',
      completedAt: { gte: startOfToday(), lte: endOfToday() },
    }

    const [tasks, total, openCount, overdueCount, completedTodayCount] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          contact: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.task.count({ where }),
      includeStats ? prisma.task.count({ where: openWhere }) : 0,
      includeStats ? prisma.task.count({ where: overdueWhere }) : 0,
      includeStats ? prisma.task.count({ where: completedTodayWhere }) : 0,
    ])

    const result = {
      tasks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      ...(includeStats && { stats: { openCount, overdueCount, completedTodayCount } }),
    }

    await multiLayerCache.set(cacheKey, result, 120).catch(() => {})

    return NextResponse.json(result)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get tasks error:', error)
    return NextResponse.json(
      { error: 'Failed to get tasks' },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    // Check CRM module license (tasks are part of CRM)
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createTaskSchema.parse(body)

    // Verify contact belongs to tenant if provided
    if (validated.contactId) {
      const contact = await prisma.contact.findFirst({
        where: {
          id: validated.contactId,
          tenantId: tenantId,
        },
      })

      if (!contact) {
        return NextResponse.json(
          { error: 'Contact not found' },
          { status: 404 }
        )
      }
    }

    // Verify assigned user belongs to tenant if provided
    if (validated.assignedToId) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: validated.assignedToId,
          tenantId: tenantId,
        },
      })

      if (!assignedUser) {
        return NextResponse.json(
          { error: 'Assigned user not found' },
          { status: 404 }
        )
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
        tenantId: tenantId,
        module: validated.module || 'crm',
        recurrenceRule: validated.recurrenceRule && validated.recurrenceRule !== 'none' ? validated.recurrenceRule : null,
        recurrenceEndDate: validated.recurrenceEndDate ? new Date(validated.recurrenceEndDate) : null,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Invalidate cache after creating task
    await multiLayerCache.deletePattern(`tasks:${tenantId}:*`).catch(() => {
      // Ignore cache errors - not critical
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create task error:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

