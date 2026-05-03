/**
 * Productivity Projects API Route
 * POST /api/productivity/projects - Create project
 * GET /api/productivity/projects - List projects
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { withErrorHandling } from '@/lib/api/route-wrapper'
import type { ApiResponse } from '@/types/base-modules'
import type { Project } from '@/modules/shared/productivity/types'
import { CreateProjectSchema } from '@/modules/shared/productivity/types'
import { formatINR } from '@/lib/currency'

/**
 * Create project
 * POST /api/productivity/projects
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  let tenantId: string
  try {
    const access = await requireModuleAccess(request, 'productivity')
    tenantId = access.tenantId
  } catch (e) {
    return handleLicenseError(e)
  }
  const body = await request.json()
  const validatedData = CreateProjectSchema.parse(body)
  if (validatedData.organizationId && validatedData.organizationId !== tenantId) {
    return NextResponse.json(
      { success: false, statusCode: 403, error: { code: 'FORBIDDEN', message: 'Tenant mismatch' } },
      { status: 403 }
    )
  }
  const organizationId = validatedData.organizationId || tenantId

  const project = await prisma.project.create({
    data: {
      tenantId: organizationId,
      name: validatedData.name,
      description: validatedData.description || '',
      status: 'planning',
      clientId: validatedData.clientId,
      startDate: new Date(validatedData.startDate),
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      budget: validatedData.budgetINR,
    },
  })

  const teamIds = validatedData.team ?? []
  if (teamIds.length > 0) {
    await prisma.projectMember.createMany({
      data: teamIds.map((userId) => ({
        projectId: project.id,
        userId,
        role: 'MEMBER',
        allocationPercentage: 100,
      })),
      skipDuplicates: true,
    })
  }

  const visibility = validatedData.visibility ?? 'team'

  const response: ApiResponse<Project> = {
    success: true,
    statusCode: 201,
    data: {
      id: project.id,
      organizationId: project.tenantId,
      name: project.name,
      description: project.description || '',
      status: project.status as Project['status'],
      clientId: project.clientId || undefined,
      startDate: project.startDate || new Date(),
      endDate: project.endDate || undefined,
      budgetINR: project.budget ? Number(project.budget) : undefined,
      actualCostINR: project.actualCost ? Number(project.actualCost) : undefined,
      tasks: [],
      milestones: [],
      team: teamIds,
      visibility: visibility as Project['visibility'],
      createdAt: project.createdAt,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response, { status: 201 })
})

/**
 * List projects
 * GET /api/productivity/projects?organizationId=xxx&status=active&page=1&pageSize=20
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  let tenantId: string
  try {
    const access = await requireModuleAccess(request, 'productivity')
    tenantId = access.tenantId
  } catch (e) {
    return handleLicenseError(e)
  }
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('organizationId') || tenantId
  if (organizationId !== tenantId) {
    return NextResponse.json(
      { success: false, statusCode: 403, error: { code: 'FORBIDDEN', message: 'Tenant mismatch' } },
      { status: 403 }
    )
  }
  const status = searchParams.get('status')
  const clientId = searchParams.get('clientId')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

  const where: Record<string, unknown> = {
    tenantId: organizationId,
  }

  if (status) {
    where.status = status
  }

  if (clientId) {
    where.clientId = clientId
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { members: { select: { userId: true } } },
    }),
    prisma.project.count({ where }),
  ])

  const formattedProjects: Project[] = projects.map((project) => ({
    id: project.id,
    organizationId: project.tenantId,
    name: project.name,
    description: project.description || '',
    status: project.status as Project['status'],
    clientId: project.clientId || undefined,
    startDate: project.startDate || new Date(),
    endDate: project.endDate || undefined,
    budgetINR: project.budget ? Number(project.budget) : undefined,
    actualCostINR: project.actualCost ? Number(project.actualCost) : undefined,
    tasks: [],
    milestones: [],
    team: project.members.map((m) => m.userId),
    visibility: 'team' as const,
    createdAt: project.createdAt,
  }))

  const response: ApiResponse<{
    projects: Project[]
    total: number
    page: number
    pageSize: number
  }> = {
    success: true,
    statusCode: 200,
    data: {
      projects: formattedProjects,
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
