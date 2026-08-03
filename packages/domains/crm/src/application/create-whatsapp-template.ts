import {
  createWhatsappTemplateInputSchema,
  type CreateWhatsappTemplateInput,
} from '../domain/schemas'
import type { WhatsappTemplateRecord } from '../domain/types'
import type { WhatsappTemplateRepository } from '../ports/whatsapp-template-repository'

export async function createWhatsappTemplate(
  input: CreateWhatsappTemplateInput,
  deps: { whatsappTemplateRepository: WhatsappTemplateRepository }
): Promise<WhatsappTemplateRecord> {
  const validated = createWhatsappTemplateInputSchema.parse(input)
  return deps.whatsappTemplateRepository.create(validated)
}
