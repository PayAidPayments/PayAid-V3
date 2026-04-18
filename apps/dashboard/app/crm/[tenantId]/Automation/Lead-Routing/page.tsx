'use client'

import { AutomationPlaceholderPage } from '@/components/crm/automation/AutomationPlaceholderPage'

export default function LeadRoutingPage() {
  return (
    <AutomationPlaceholderPage
      title="Lead routing"
      description="Define routing hierarchy: account or contact owner, named accounts, territory, product interest, source, language or team, score buckets, weighted round robin, and fallback queues."
    />
  )
}
