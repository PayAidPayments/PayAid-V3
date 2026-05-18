import { prisma } from '@payaid/db'
import type { ListProjectsInput } from '../domain/schemas'
import type { ProjectListResult } from '../domain/types'
import type { ProjectRepository } from '../ports/project-repository'

export class PrismaProjectRepository implements ProjectRepository {
  async list(input: ListProjectsInput): Promise<ProjectListResult> {
    const where: {
      tenantId: string
      status?: string
      ownerId?: string
      clientId?: string
      OR?: Array<Record<string, unknown>>
    } = { tenantId: input.tenantId }

    if (input.status) where.status = input.status
    if (input.ownerId) where.ownerId = input.ownerId
    if (input.clientId) where.clientId = input.clientId
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { code: { contains: input.search, mode: 'insensitive' } },
        { description: { contains: input.search, mode: 'insensitive' } },
      ]
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          client: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true, members: true, timeEntries: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      prisma.project.count({ where }),
    ])

    return {
      projects: projects as ProjectListResult['projects'],
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit) || 0,
      },
    }
  }
}
