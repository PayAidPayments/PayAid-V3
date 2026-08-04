import type { SegmentCriterion } from './schemas'

export type SegmentRecord = {
  id: string
  organizationId: string
  name: string
  criteria: SegmentCriterion[]
  contactCount: number
  createdAt: Date
}

export type WhatsappTemplateRecord = {
  id: string
  tenantId: string
  name: string
  category: string | null
  body: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
