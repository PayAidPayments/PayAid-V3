import type { WhatsappTemplateRecord } from '../domain/types'
import type { WhatsappTemplateRepository } from '../ports/whatsapp-template-repository'

export async function listWhatsappTemplates(
  tenantId: string,
  deps: { whatsappTemplateRepository: WhatsappTemplateRepository }
): Promise<WhatsappTemplateRecord[]> {
  return deps.whatsappTemplateRepository.listActive(tenantId)
}
