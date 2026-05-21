export type ProjectListRecord = Record<string, unknown>

export type ProjectListResult = {
  projects: ProjectListRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
