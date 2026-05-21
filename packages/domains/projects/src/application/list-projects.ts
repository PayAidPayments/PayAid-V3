import { listProjectsInputSchema, type ListProjectsInput } from '../domain/schemas'
import type { ProjectListResult } from '../domain/types'
import type { ProjectRepository } from '../ports/project-repository'

export async function listProjects(
  input: ListProjectsInput,
  deps: { projectRepository: ProjectRepository }
): Promise<ProjectListResult> {
  const validated = listProjectsInputSchema.parse(input)
  return deps.projectRepository.list(validated)
}
