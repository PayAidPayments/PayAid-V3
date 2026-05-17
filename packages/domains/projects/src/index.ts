import { listProjects } from './application/list-projects'
import type { ListProjectsInput } from './domain/schemas'
import { PrismaProjectRepository } from './infrastructure/prisma-project-repository'

export { listProjects } from './application/list-projects'
export { listProjectsInputSchema } from './domain/schemas'
export type { ListProjectsInput } from './domain/schemas'
export type { ProjectListRecord, ProjectListResult } from './domain/types'
export type { ProjectRepository } from './ports/project-repository'
export { PrismaProjectRepository } from './infrastructure/prisma-project-repository'

export function createProjectsDomainDeps() {
  const projectRepository = new PrismaProjectRepository()
  return {
    projectRepository,
    listProjects: (input: ListProjectsInput) => listProjects(input, { projectRepository }),
  }
}
