import { z } from 'zod'

export const segmentCriterionSchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']),
  value: z.unknown(),
})

export const createSegmentInputSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(255),
  criteria: z.array(segmentCriterionSchema),
})

export type SegmentCriterion = z.infer<typeof segmentCriterionSchema>
export type CreateSegmentInput = z.infer<typeof createSegmentInputSchema>

export const createWhatsappTemplateInputSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
  body: z.string().min(1),
})

export type CreateWhatsappTemplateInput = z.infer<typeof createWhatsappTemplateInputSchema>
