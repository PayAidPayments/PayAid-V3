/**
 * CRM Module Types - Base Module
 * Shared across all industries
 */

import { Contact, Segment, LeadPipeline, ContactType, ContactStatus } from '@/types/base-modules'

export interface CreateContactRequest {
  organizationId: string
  industryModule: string
  firstName: string
  lastName: string
  email: string
  phone: string
  contactType: ContactType
  tags?: string[]
  customFields?: Record<string, unknown>
  notes?: string
}

export interface UpdateContactRequest {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  contactType?: ContactType
  status?: ContactStatus
  tags?: string[]
  customFields?: Record<string, unknown>
  notes?: string
}

export interface ContactListFilters {
  organizationId: string
  contactType?: ContactType
  status?: ContactStatus
  tags?: string[]
  search?: string
  page?: number
  pageSize?: number
}

export interface ContactListResponse {
  contacts: Contact[]
  total: number
  page: number
  pageSize: number
}

export interface CreateSegmentRequest {
  organizationId: string
  name: string
  criteria: Array<{
    field: string
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
    value: unknown
  }>
}

export interface CreatePipelineRequest {
  organizationId: string
  name: string
  stages: Array<{
    name: string
    order: number
    probability: number
  }>
}
