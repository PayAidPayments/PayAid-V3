/**
 * Base Module Type Definitions - PayAid V3
 * Shared across all 20 industries
 * STRICT TYPESCRIPT - No 'any' types allowed
 */

/**
 * Base Modules (shared across all industries)
 */
export type BaseModule = 
  | 'crm'
  | 'finance'
  | 'marketing'
  | 'communication'
  | 'hr'
  | 'analytics'
  | 'productivity'

/**
 * Industry Types
 */
export type IndustryType =
  | 'freelancer'
  | 'service-business'
  | 'retail'
  | 'restaurant'
  | 'manufacturing'
  | 'ecommerce'
  | 'professional-services'
  | 'healthcare'
  | 'education'
  | 'real-estate'
  | 'logistics'
  | 'construction'
  | 'beauty'
  | 'automotive'
  | 'hospitality'
  | 'legal'
  | 'financial-services'
  | 'event-management'
  | 'wholesale'
  | 'agriculture'

/**
 * Contact Types (CRM Module)
 */
export type ContactType = 'lead' | 'customer' | 'supplier' | 'prospect'

export type ContactStatus = 'active' | 'inactive' | 'archived'

export interface Contact {
  id: string
  organizationId: string
  industryModule: IndustryType
  firstName: string
  lastName: string
  email: string
  phone: string
  contactType: ContactType
  status: ContactStatus
  tags: string[]
  customFields: Record<string, unknown>
  communicationHistory: Communication[]
  transactionHistory: Transaction[]
  notes: string
  attachments: Attachment[]
  createdAt: Date
  updatedAt: Date
  industrySpecificData?: Record<string, unknown>
}

export interface Segment {
  id: string
  organizationId: string
  name: string
  criteria: FilterCriteria[]
  contactCount: number
  createdAt: Date
}

export interface FilterCriteria {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: unknown
}

export interface LeadPipeline {
  id: string
  organizationId: string
  name: string
  stages: PipelineStage[]
  currency: 'INR' // Always INR
  totalValue: number // In ₹
}

export interface PipelineStage {
  id: string
  name: string
  order: number
  probability: number // 0-100
}

/**
 * Communication Types
 */
export type CommunicationChannel = 'email' | 'whatsapp' | 'sms' | 'in_app'

export type CommunicationDirection = 'inbound' | 'outbound'

export type CommunicationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Communication {
  id: string
  organizationId: string
  channel: CommunicationChannel
  direction: CommunicationDirection
  senderContactId: string
  senderName: string
  senderAddress: string
  recipientContactId?: string
  subject?: string
  message: string
  attachments: Attachment[]
  status: CommunicationStatus
  linkedTo?: {
    type: 'invoice' | 'project' | 'case' | 'order'
    id: string
  }
  sentiment?: 'positive' | 'neutral' | 'negative'
  aiSummary?: string
  responseTemplate?: string
  createdAt: Date
  readAt?: Date
}

/**
 * Transaction Types
 */
export interface Transaction {
  id: string
  organizationId: string
  contactId: string
  type: 'invoice' | 'payment' | 'refund' | 'expense'
  amount: number // In ₹
  currency: 'INR' // Always INR
  date: Date
  description: string
  referenceId?: string
}

/**
 * Attachment Types
 */
export interface Attachment {
  id: string
  organizationId: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  uploadedBy: string
  uploadedAt: Date
}

/**
 * API Response Format (Standardized)
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  statusCode: number
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      total: number
    }
    timestamp: string
  }
}
