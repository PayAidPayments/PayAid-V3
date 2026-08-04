import type { SegmentRecord } from '../domain/types'
import type { SegmentRepository } from '../ports/segment-repository'

export async function listSegments(
  organizationId: string,
  deps: { segmentRepository: SegmentRepository }
): Promise<SegmentRecord[]> {
  if (!organizationId) {
    throw new Error('MISSING_ORGANIZATION_ID')
  }
  return deps.segmentRepository.listByOrganization(organizationId)
}
