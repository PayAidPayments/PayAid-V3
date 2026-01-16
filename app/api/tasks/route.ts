import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { prismaRead } from '@/lib/db/prisma-read'
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
})

// GET /api/tasks - List all tasks
export async function GET(request: NextRequest) {
  try {
    // Check CRM module license (tasks are part of CRM)
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const assignedToId = searchParams.get('assignedToId')
    const contactId = searchParams.get('contactId')

    // Build cache key
    const cacheKey = `tasks:${tenantId}:${page}:${limit}:${status || 'all'}:${assignedToId || 'all'}:${contactId || 'all'}`

    // Check cache (multi-layer: L1 memory -> L2 Redis)
    const cached = await multiLayerCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const where: any = {
      tenantId: tenantId,
    }

    if (status) where.status = status
    if (assignedToId) where.assignedToId = assignedToId
    if (contactId) where.contactId = contactId

    // Use read replica for GET requests
    const [tasks, total] = await Promise.all([
      prismaRead.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prismaRead.task.count({ where }),
    ])

    const result = {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }

    // Cache for 3 minutes (multi-layer: L1 + L2)
    await multiLayerCache.set(cacheKey, result, 180).catch(() => {
      // Ignore cache errors - not critical
    })

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

