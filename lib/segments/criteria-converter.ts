import { SegmentCriteria } from '@/components/segments/SegmentBuilder'

/**
 * Convert visual criteria to string format for storage
 */
export function criteriaToString(criteria: SegmentCriteria[]): string {
  if (criteria.length === 0) return ''

  return criteria
    .map((criterion, index) => {
      const logicalOp = index > 0 ? ` ${criterion.logicalOperator || 'AND'} ` : ''
      const field = criterion.field
      const operator = criterion.operator
      const value = criterion.value

      // Handle operators that don't need values
      if (operator === 'isEmpty' || operator === 'isNotEmpty') {
        return `${logicalOp}${field} ${operator}`
      }

      // Handle between operator
      if (operator === 'between') {
        const [from, to] = value.split('|')
        return `${logicalOp}${field} between ${from} and ${to}`
      }

      // Handle date operators with days
      if (operator === 'lastDays' || operator === 'nextDays') {
        return `${logicalOp}${field} ${operator} ${value}`
      }

      // Standard operators
      const operatorMap: Record<string, string> = {
        equals: '=',
        notEquals: '!=',
        contains: 'contains',
        startsWith: 'startsWith',
        endsWith: 'endsWith',
        greaterThan: '>',
        lessThan: '<',
        greaterThanOrEqual: '>=',
        lessThanOrEqual: '<=',
        before: '<',
        after: '>',
      }

      const opSymbol = operatorMap[operator] || operator
      return `${logicalOp}${field} ${opSymbol} ${value}`
    })
    .join('')
}

/**
 * Parse string criteria back to visual format
 */
export function stringToCriteria(criteriaString: string): SegmentCriteria[] {
  if (!criteriaString) return [{ field: '', operator: '', value: '' }]

  // Simple parser - in production, use a proper query parser
  const parts = criteriaString.split(/\s+(AND|OR)\s+/i)
  const criteria: SegmentCriteria[] = []

  let logicalOp: 'AND' | 'OR' = 'AND'
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim()

    if (part === 'AND' || part === 'OR') {
      logicalOp = part.toUpperCase() as 'AND' | 'OR'
      continue
    }

    // Parse individual criterion
    // Format: field operator value
    const match = part.match(/^(\w+)\s+(.+?)(?:\s+(.+))?$/)
    if (match) {
      const [, field, operatorPart, valuePart] = match
      let operator = operatorPart
      let value = valuePart || ''

      // Handle special operators
      if (operatorPart === 'between') {
        operator = 'between'
        // Value should be in format "value1 and value2"
        const betweenMatch = valuePart?.match(/^(.+?)\s+and\s+(.+)$/i)
        if (betweenMatch) {
          value = `${betweenMatch[1]}|${betweenMatch[2]}`
        }
      } else if (operatorPart === 'isEmpty' || operatorPart === 'isNotEmpty') {
        operator = operatorPart
        value = ''
      } else if (operatorPart === 'lastDays' || operatorPart === 'nextDays') {
        operator = operatorPart
        value = valuePart || ''
      } else {
        // Map operator symbols back
        const symbolMap: Record<string, string> = {
          '=': 'equals',
          '!=': 'notEquals',
          '>': 'greaterThan',
          '<': 'lessThan',
          '>=': 'greaterThanOrEqual',
          '<=': 'lessThanOrEqual',
        }
        operator = symbolMap[operatorPart] || operatorPart
        value = valuePart || ''
      }

      criteria.push({
        field,
        operator,
        value,
        logicalOperator: i > 0 ? logicalOp : undefined,
      })
    }
  }

  return criteria.length > 0 ? criteria : [{ field: '', operator: '', value: '' }]
}

/**
 * Convert criteria to JSON config for storage
 */
export function criteriaToConfig(criteria: SegmentCriteria[]): string {
  return JSON.stringify(criteria)
}

/**
 * Parse JSON config back to criteria
 */
export function configToCriteria(config: string): SegmentCriteria[] {
  try {
    return JSON.parse(config) as SegmentCriteria[]
  } catch {
    return [{ field: '', operator: '', value: '' }]
  }
}

