export interface AIProspect {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  status: 'pending' | 'contacted' | 'qualified' | 'converted' | 'rejected'
  intentScore: number
  lastContacted?: string
  nextFollowUp?: string
  contactCount: number
  source: string
}

import type { AutomationOperationStats } from './workspace-types'

export interface OutreachCampaign {
  id: string
  name: string
  type: 'cold-email' | 'cold-call' | 'linkedin' | 'multi-channel'
  status: 'draft' | 'active' | 'paused' | 'completed'
  prospectsCount: number
  contactedCount: number
  responseRate: number
  conversionRate: number
  createdAt: string
  operationStats?: AutomationOperationStats
}
