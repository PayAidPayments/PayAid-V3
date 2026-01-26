/**
 * Productivity Tasks API Route
 * POST /api/productivity/tasks - Create task
 * GET /api/productivity/tasks - List tasks
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandling } from '@/lib/api/route-wrapper'
import { ApiResponse, Task } from '@/types/base-modules'
import { CreateTaskSchema } from '@/modules/shared/productivity/types'

/**
 * Create task
 * POST /api/productivity/tasks
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CreateTaskSchema.parse(body)

  const task = await prisma.task.create({
    data: {
      tenantId: validatedData.organizationId,
      title: validatedData.title,
      description: validatedData.description || '',
      priority: validatedData.priority,
      status: 'todo',
      assignedToId: validatedData.assignedTo?.[0] || null,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      // Note: estimatedHours is only available for ProjectTask, not regular Task
    },
  })

  const response: ApiResponse<Task> = {
    success: true,
    statusCode: 201,
    data: {
      id: task.id,
      organizationId: task.tenantId,
      projectId: undefined, // Task model doesn't have projectId, only ProjectTask does
      title: task.title,
      description: task.description || '',
      priority: task.priority as Task['priority'],
      status: task.status as Task['status'],
      assignedTo: task.assignedToId ? [task.assignedToId] : [],
      dueDate: task.dueDate || undefined,
      estimatedHours: undefined, // Task model doesn't have estimatedHours
      subtasks: [],
      attachments: [],
      comments: [],
      createdAt: task.createdAt,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response, { status: 201 })
})

/**
 * List tasks
 * GET /api/productivity/tasks?organizationId=xxx&status=todo&projectId=xxx&page=1&pageSize=20
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('organizationId')
  const status = searchParams.get('status')
  const projectId = searchParams.get('projectId')
  const assignedTo = searchParams.get('assignedTo')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

  if (!organizationId) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 400,
        error: {
          code: 'MISSING_ORGANIZATION_ID',
          message: 'organizationId is required',
        },
      },
      { status: 400 }
    )
  }

  const where: Record<string, unknown> = {
    tenantId: organizationId,
  }

  if (status) {
    where.status = status
  }

  if (projectId) {
    where.projectId = projectId
  }

  if (assignedTo) {
    where.assignedTo = {
      has: assignedTo,
    }
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.task.count({ where }),
  ])

  const formattedTasks: Task[] = tasks.map((task) => ({
    id: task.id,
    organizationId: task.tenantId,
    projectId: task.projectId || undefined,
    title: task.title,
    description: task.description,
    priority: task.priority as Task['priority'],
    status: task.status as Task['status'],
    assignedTo: task.assignedTo as string[],
    dueDate: task.dueDate || undefined,
    estimatedHours: task.estimatedHours || undefined,
    actualHoursSpent: task.actualHoursSpent || undefined,
    subtasks: [],
    attachments: [],
    comments: [],
    createdAt: task.createdAt,
  }))

  const response: ApiResponse<{
    tasks: Task[]
    total: number
    page: number
    pageSize: number
  }> = {
    success: true,
    statusCode: 200,
    data: {
      tasks: formattedTasks,
      total,
      page,
      pageSize,
    },
    meta: {
      pagination: {
        page,
        pageSize,
        total,
      },
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response)
})
