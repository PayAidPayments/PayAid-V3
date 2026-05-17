import { z } from 'zod'

export const listProjectsInputSchema = z.object({
  tenantId: z.string().min(1),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
  status: z.string().optional(),
  ownerId: z.string().optional(),
  clientId: z.string().optional(),
  search: z.string().optional(),
})

export type ListProjectsInput = z.infer<typeof listProjectsInputSchema>
