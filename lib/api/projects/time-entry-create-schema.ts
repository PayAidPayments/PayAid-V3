import { z } from 'zod'

/** Body for POST `/api/projects/time-entries` (§10.1 integrity: `projectId` required). */
export const createTimeEntryBodySchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().optional(),
  date: z.string().datetime(),
  hours: z.number().positive(),
  description: z.string().optional(),
  billable: z.boolean().optional(),
  billingRate: z.number().optional(),
  approvalStatus: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CORRECTED']).optional(),
  source: z.enum(['TIMER', 'MANUAL', 'IMPORT', 'SEED']).optional(),
  isAdhoc: z.boolean().optional(),
  costRate: z.number().optional(),
})
