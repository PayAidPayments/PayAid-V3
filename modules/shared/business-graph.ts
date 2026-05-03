import { z } from 'zod'

/**
 * Canonical module keys used by shared business-graph contracts.
 * Keep this list constrained to cross-module business domains.
 */
export const BUSINESS_GRAPH_MODULES = ['crm', 'finance', 'marketing', 'projects', 'inventory'] as const

export type BusinessGraphModule = (typeof BUSINESS_GRAPH_MODULES)[number]

/**
 * Entity IDs in this codebase are mixed (`cuid` in Prisma and UUID in some legacy surfaces),
 * so shared contracts must safely accept both formats.
 */
export const EntityIdSchema = z.union([z.string().uuid(), z.string().cuid()]).describe('EntityId')

export type EntityId = z.infer<typeof EntityIdSchema>

export const BusinessEntityRefSchema = z.object({
  module: z.enum(BUSINESS_GRAPH_MODULES),
  entity: z.string().min(1),
  id: EntityIdSchema,
})

export type BusinessEntityRef = z.infer<typeof BusinessEntityRefSchema>
