import type { SegmentCriterion } from './schemas'

/** Build Prisma where clause from segment criteria (shared by list counts and create). */
export function buildWhereClauseFromCriteria(
  criteria: SegmentCriterion[]
): Record<string, unknown> {
  if (!Array.isArray(criteria) || criteria.length === 0) {
    return {}
  }

  const validCriteria = criteria.filter((c) => c.value !== undefined)
  const where: Record<string, unknown> = {}

  for (const criterion of validCriteria) {
    switch (criterion.operator) {
      case 'equals':
        where[criterion.field] = criterion.value
        break
      case 'contains':
        where[criterion.field] = {
          contains: criterion.value,
          mode: 'insensitive',
        }
        break
      case 'greater_than':
        where[criterion.field] = { gt: criterion.value }
        break
      case 'less_than':
        where[criterion.field] = { lt: criterion.value }
        break
      case 'in':
        where[criterion.field] = {
          in: Array.isArray(criterion.value) ? criterion.value : [criterion.value],
        }
        break
      case 'not_in':
        where[criterion.field] = {
          notIn: Array.isArray(criterion.value) ? criterion.value : [criterion.value],
        }
        break
    }
  }

  return where
}
