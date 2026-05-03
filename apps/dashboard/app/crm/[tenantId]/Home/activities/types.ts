export interface ActivityContact {
  id?: string
  name?: string
  email?: string
  company?: string | { name?: string } | null
}

export interface ActivityMetadata {
  duration?: number
  value?: number
  stage?: string
  outcome?: string
  dueDate?: string
  expectedCloseDate?: string
  assignedToId?: string
  probability?: number
  purpose?: string
  nextStep?: string
  owner?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  priority?: 'low' | 'medium' | 'high'
}

export interface ActivityItem {
  id: string
  type: string
  title: string
  description?: string
  status?: string
  timestamp: string
  contact?: ActivityContact
  metadata?: ActivityMetadata
}
