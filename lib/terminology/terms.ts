export type CanonicalTerm =
  | 'lead'
  | 'contact'
  | 'deal'
  | 'task'
  | 'account'
  | 'pipeline'
  | 'customer'

export type TerminologyMap = Record<CanonicalTerm, string>

export const DEFAULT_TERMS: TerminologyMap = {
  lead: 'Lead',
  contact: 'Contact',
  deal: 'Deal',
  task: 'Task',
  account: 'Account',
  pipeline: 'Pipeline',
  customer: 'Customer',
}

export const DEFAULT_PLURAL_TERMS: TerminologyMap = {
  lead: 'Leads',
  contact: 'Contacts',
  deal: 'Deals',
  task: 'Tasks',
  account: 'Accounts',
  pipeline: 'Pipelines',
  customer: 'Customers',
}
