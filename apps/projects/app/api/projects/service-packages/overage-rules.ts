import { z } from 'zod'

const percentField = z
  .number()
  .finite()
  .min(1, 'must be >= 1')
  .max(500, 'must be <= 500')

const overageRulesShape = z
  .object({
    warnUtilizationPercent: percentField.optional(),
    projectedWarnUtilizationPercent: percentField.optional(),
    breachUtilizationPercent: percentField.optional(),
  })
  .strict()

export type ValidatedOverageRules = z.infer<typeof overageRulesShape>

export function validateOverageRulesInput(value: unknown) {
  if (value === undefined) {
    return { kind: 'missing' as const, parsed: undefined }
  }
  if (value === null) {
    return { kind: 'clear' as const, parsed: null }
  }
  const parsed = overageRulesShape.safeParse(value)
  if (!parsed.success) {
    return {
      kind: 'invalid' as const,
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    }
  }
  const rules = parsed.data
  const warn = rules.warnUtilizationPercent
  const projectedWarn = rules.projectedWarnUtilizationPercent
  const breach = rules.breachUtilizationPercent
  if (warn !== undefined && breach !== undefined && warn > breach) {
    return {
      kind: 'invalid' as const,
      issues: [
        {
          path: 'warnUtilizationPercent',
          message: 'must be <= breachUtilizationPercent',
        },
      ],
    }
  }
  if (projectedWarn !== undefined && breach !== undefined && projectedWarn > breach) {
    return {
      kind: 'invalid' as const,
      issues: [
        {
          path: 'projectedWarnUtilizationPercent',
          message: 'must be <= breachUtilizationPercent',
        },
      ],
    }
  }
  return { kind: 'valid' as const, parsed: rules as ValidatedOverageRules }
}

