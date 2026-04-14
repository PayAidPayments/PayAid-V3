import { WorkspaceTab } from './types'

export const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  under_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  converted: 'bg-purple-100 text-purple-700',
}

export const TABS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'builder', label: 'Builder' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'document', label: 'Document Preview' },
  { id: 'history', label: 'History' },
]

export const PRODUCT_CATALOG = [
  'Enterprise License',
  'Growth License',
  'Onboarding Pack',
  'Priority Support',
  'Success Manager',
  'Data Migration',
  'Analytics Add-on',
  'API Integrations',
  'Training Workshop',
  'Compliance Review',
  'Implementation Sprint',
]
