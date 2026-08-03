import type { CreateWhatsappTemplateInput } from '../domain/schemas'
import type { WhatsappTemplateRecord } from '../domain/types'

export interface WhatsappTemplateRepository {
  listActive(tenantId: string): Promise<WhatsappTemplateRecord[]>
  create(input: CreateWhatsappTemplateInput): Promise<WhatsappTemplateRecord>
}
