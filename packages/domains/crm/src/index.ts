import { createSegment } from './application/create-segment'
import { createWhatsappTemplate } from './application/create-whatsapp-template'
import { listSegments } from './application/list-segments'
import { listWhatsappTemplates } from './application/list-whatsapp-templates'
import type { CreateSegmentInput, CreateWhatsappTemplateInput } from './domain/schemas'
import { PrismaSegmentRepository } from './infrastructure/prisma-segment-repository'
import { PrismaWhatsappTemplateRepository } from './infrastructure/prisma-whatsapp-template-repository'

export { createSegment } from './application/create-segment'
export { listSegments } from './application/list-segments'
export { createWhatsappTemplate } from './application/create-whatsapp-template'
export { listWhatsappTemplates } from './application/list-whatsapp-templates'
export { createSegmentInputSchema, createWhatsappTemplateInputSchema } from './domain/schemas'
export type { CreateSegmentInput, CreateWhatsappTemplateInput, SegmentCriterion } from './domain/schemas'
export type { SegmentRecord, WhatsappTemplateRecord } from './domain/types'
export type { SegmentRepository } from './ports/segment-repository'
export type { WhatsappTemplateRepository } from './ports/whatsapp-template-repository'
export { PrismaSegmentRepository } from './infrastructure/prisma-segment-repository'
export { PrismaWhatsappTemplateRepository } from './infrastructure/prisma-whatsapp-template-repository'

/** Default in-process wiring for Next.js API routes (modular monolith). */
export function createCrmDomainDeps() {
  const segmentRepository = new PrismaSegmentRepository()
  const whatsappTemplateRepository = new PrismaWhatsappTemplateRepository()
  return {
    segmentRepository,
    whatsappTemplateRepository,
    listSegments: (organizationId: string) => listSegments(organizationId, { segmentRepository }),
    createSegment: (input: CreateSegmentInput) => createSegment(input, { segmentRepository }),
    listWhatsappTemplates: (tenantId: string) =>
      listWhatsappTemplates(tenantId, { whatsappTemplateRepository }),
    createWhatsappTemplate: (input: CreateWhatsappTemplateInput) =>
      createWhatsappTemplate(input, { whatsappTemplateRepository }),
  }
}
