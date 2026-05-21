import { z } from 'zod'

const hoursField = z
  .number()
  .finite()
  .min(0, 'must be >= 0')
  .max(8760, 'must be <= 8760')

const slaPolicyShape = z
  .object({
    trackMilestones: z.boolean().optional(),
    trackTasks: z.boolean().optional(),
    milestoneWarnHoursBeforeDue: hoursField.optional(),
    milestoneBreachGraceHours: hoursField.optional(),
    taskWarnHoursBeforeDue: hoursField.optional(),
    taskBreachGraceHours: hoursField.optional(),
  })
  .strict()

export type ValidatedSlaPolicy = z.infer<typeof slaPolicyShape>

export function normalizeSlaPolicy(raw: unknown): Required<
  Omit<ValidatedSlaPolicy, 'trackMilestones' | 'trackTasks'>
> & { trackMilestones: boolean; trackTasks: boolean } {
  const base = {
    trackMilestones: true as boolean,
    trackTasks: true as boolean,
    milestoneWarnHoursBeforeDue: 0,
    milestoneBreachGraceHours: 0,
    taskWarnHoursBeforeDue: 0,
    taskBreachGraceHours: 0,
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base
  const o = raw as Record<string, unknown>
  if (typeof o.trackMilestones === 'boolean') base.trackMilestones = o.trackMilestones
  if (typeof o.trackTasks === 'boolean') base.trackTasks = o.trackTasks
  const mw = o.milestoneWarnHoursBeforeDue
  if (typeof mw === 'number' && Number.isFinite(mw) && mw >= 0 && mw <= 8760) {
    base.milestoneWarnHoursBeforeDue = mw
  }
  const mg = o.milestoneBreachGraceHours
  if (typeof mg === 'number' && Number.isFinite(mg) && mg >= 0 && mg <= 8760) {
    base.milestoneBreachGraceHours = mg
  }
  const tw = o.taskWarnHoursBeforeDue
  if (typeof tw === 'number' && Number.isFinite(tw) && tw >= 0 && tw <= 8760) {
    base.taskWarnHoursBeforeDue = tw
  }
  const tg = o.taskBreachGraceHours
  if (typeof tg === 'number' && Number.isFinite(tg) && tg >= 0 && tg <= 8760) {
    base.taskBreachGraceHours = tg
  }
  return base
}

export function validateSlaPolicyInput(value: unknown) {
  if (value === undefined) {
    return { kind: 'missing' as const, parsed: undefined }
  }
  if (value === null) {
    return { kind: 'clear' as const, parsed: null }
  }
  const parsed = slaPolicyShape.safeParse(value)
  if (!parsed.success) {
    return {
      kind: 'invalid' as const,
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    }
  }
  return { kind: 'valid' as const, parsed: parsed.data as ValidatedSlaPolicy }
}
