import type { ListProjectsInput } from '../domain/schemas'
import type { ProjectListResult } from '../domain/types'

export interface ProjectRepository {
  list(input: ListProjectsInput): Promise<ProjectListResult>
}
