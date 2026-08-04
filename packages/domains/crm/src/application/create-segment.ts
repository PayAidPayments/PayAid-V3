import { createSegmentInputSchema, type CreateSegmentInput } from '../domain/schemas'
import type { SegmentRecord } from '../domain/types'
import type { SegmentRepository } from '../ports/segment-repository'

export async function createSegment(
  input: CreateSegmentInput,
  deps: { segmentRepository: SegmentRepository }
): Promise<SegmentRecord> {
  const validated = createSegmentInputSchema.parse(input)
  return deps.segmentRepository.create(validated)
}
