import { prisma } from '@payaid/db'
import type { CreateSegmentInput, SegmentCriterion } from '../domain/schemas'
import { buildWhereClauseFromCriteria } from '../domain/segment-criteria'
import type { SegmentRecord } from '../domain/types'
import type { SegmentRepository } from '../ports/segment-repository'

function parseCriteria(raw: string | unknown): SegmentCriterion[] {
  const criteriaArray =
    typeof raw === 'string' ? JSON.parse(raw || '[]') : raw
  return Array.isArray(criteriaArray) ? criteriaArray : []
}

async function countContactsForCriteria(
  organizationId: string,
  criteria: SegmentCriterion[]
): Promise<number> {
  const whereClause = buildWhereClauseFromCriteria(criteria)
  return prisma.contact.count({
    where: {
      tenantId: organizationId,
      ...whereClause,
    },
  })
}

function toSegmentRecord(
  row: { id: string; tenantId: string; name: string; criteria: string; createdAt: Date },
  contactCount: number
): SegmentRecord {
  return {
    id: row.id,
    organizationId: row.tenantId,
    name: row.name,
    criteria: parseCriteria(row.criteria),
    contactCount,
    createdAt: row.createdAt,
  }
}

export class PrismaSegmentRepository implements SegmentRepository {
  async listByOrganization(organizationId: string): Promise<SegmentRecord[]> {
    const segments = await prisma.segment.findMany({
      where: { tenantId: organizationId },
      orderBy: { createdAt: 'desc' },
    })

    return Promise.all(
      segments.map(async (segment) => {
        let contactCount = 0
        try {
          const criteria = parseCriteria(segment.criteria)
          contactCount = await countContactsForCriteria(organizationId, criteria)
        } catch (error) {
          console.error(`Error calculating contact count for segment ${segment.id}:`, error)
        }
        return toSegmentRecord(segment, contactCount)
      })
    )
  }

  async create(input: CreateSegmentInput): Promise<SegmentRecord> {
    const segment = await prisma.segment.create({
      data: {
        tenantId: input.organizationId,
        name: input.name,
        criteria: JSON.stringify(input.criteria),
        criteriaConfig: JSON.stringify(input.criteria),
      },
    })

    let contactCount = 0
    try {
      contactCount = await countContactsForCriteria(input.organizationId, input.criteria)
    } catch (error) {
      console.error('Error calculating contact count for new segment:', error)
    }

    return toSegmentRecord(segment, contactCount)
  }
}
