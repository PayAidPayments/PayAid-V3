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

export interface DashboardWidget {
  id: string
  organizationId: string
  dashboardId: string
  widgetType: 'metric' | 'chart' | 'table' | 'gauge' | 'heatmap'
  title: string
  dataSource: {
    module: string
    metric: string
    filters?: Record<string, unknown>
    dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
  }
  displayOptions?: {
    chartType?: 'line' | 'bar' | 'pie' | 'area'
    currencyDisplay: 'INR'
    compareWith?: 'previous_period' | 'previous_year'
  }
  position: { x: number; y: number }
  size: { width: number; height: number }
  refreshInterval?: number
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
 * Invoice Types (Finance Module)
 */
export interface Invoice {
  id: string
  organizationId: string
  invoiceNumber: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  lineItems: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    taxRate: number
    hsnCode?: string
    amount: number
    taxAmount: number
  }>
  subtotalINR: number
  totalTax: number
  discountINR: number
  totalINR: number
  taxBreakdown: Record<string, number>
  paymentTerms?: string
  invoiceDate: Date
  dueDate?: Date
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'
  paymentLinkUrl?: string
  isRecurring?: boolean
  recurringInterval?: 'monthly' | 'quarterly' | 'yearly'
  createdAt: Date
  updatedAt: Date
}

/**
 * Expense Types (Finance Module)
 */
export interface Expense {
  id: string
  organizationId: string
  description: string
  amountINR: number
  category: 'office' | 'travel' | 'marketing' | 'utilities' | 'supplies' | 'other'
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'upi' | 'other'
  vendor?: string
  receiptAttachment?: string
  isRecurring: boolean
  allocationToInvoice?: string
  date: Date
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  createdAt: Date
  updatedAt: Date
}

/**
 * GST Return Types (Finance Module)
 */
export interface GSTReturn {
  id: string
  organizationId: string
  period: 'monthly' | 'quarterly'
  month: number
  year: number
  totalSalesINR: number
  totalPurchasesINR: number
  outputGST: number
  inputGST: number
  netGSTPayable: number
  taxBreakdown: Record<string, {
    sales: number
    purchases: number
    outputGST: number
    inputGST: number
  }>
  status: 'draft' | 'filed' | 'paid'
  filedAt?: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * Task Types (Productivity Module)
 */
export interface Task {
  id: string
  organizationId: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'blocked' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedTo: string[]
  dueDate?: Date
  projectId?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Project Types (Productivity Module)
 */
export interface Project {
  id: string
  organizationId: string
  name: string
  description?: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  startDate?: Date
  endDate?: Date
  budgetINR?: number
  clientId?: string
  teamMembers: string[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Report Types (Analytics Module)
 */
export interface Report {
  id: string
  organizationId: string
  name: string
  type: 'financial' | 'sales' | 'inventory' | 'hr' | 'custom'
  module: string
  filters: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
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
