import { prisma } from '@payaid/db'
import type { CreateWhatsappTemplateInput } from '../domain/schemas'
import type { WhatsappTemplateRecord } from '../domain/types'
import type { WhatsappTemplateRepository } from '../ports/whatsapp-template-repository'

function toRecord(row: {
  id: string
  tenantId: string
  name: string
  category: string | null
  body: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}): WhatsappTemplateRecord {
  return { ...row }
}

export class PrismaWhatsappTemplateRepository implements WhatsappTemplateRepository {
  async listActive(tenantId: string): Promise<WhatsappTemplateRecord[]> {
    const templates = await prisma.crmWhatsappTemplate.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    })
    return templates.map(toRecord)
  }

  async create(input: CreateWhatsappTemplateInput): Promise<WhatsappTemplateRecord> {
    const template = await prisma.crmWhatsappTemplate.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        category: input.category || null,
        body: input.body,
      },
    })
    return toRecord(template)
  }
}
