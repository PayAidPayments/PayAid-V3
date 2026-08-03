import type { CreateSegmentInput } from '../domain/schemas'
import type { SegmentRecord } from '../domain/types'

export interface SegmentRepository {
  listByOrganization(organizationId: string): Promise<SegmentRecord[]>
  create(input: CreateSegmentInput): Promise<SegmentRecord>
}
