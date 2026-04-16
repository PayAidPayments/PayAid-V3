import { SpecialistDefinition } from './types'

export const SPECIALISTS: SpecialistDefinition[] = [
  {
    id: 'sales-copilot',
    name: 'Sales Co-pilot',
    promise: 'Prioritize leads, suggest next best action, and draft follow-ups.',
    modules: ['crm', 'sales'],
    allowedActionLevels: ['read', 'draft', 'guarded_write'],
    restrictedActions: ['send_outbound_message', 'close_deal_without_approval'],
    promptChips: ['Draft follow-up', 'Summarize this contact', 'What is the next best action?'],
  },
  {
    id: 'marketing-strategist',
    name: 'Marketing Strategist',
    promise: 'Plan campaigns, audiences, and messaging for business goals.',
    modules: ['marketing'],
    allowedActionLevels: ['read', 'draft'],
    promptChips: ['Build campaign plan', 'Suggest target audience', 'Create messaging angles'],
  },
  {
    id: 'campaign-builder',
    name: 'Campaign Builder',
    promise: 'Generate campaign drafts ready for review and launch.',
    modules: ['marketing'],
    allowedActionLevels: ['read', 'draft', 'guarded_write', 'restricted'],
    restrictedActions: ['publish_campaign', 'send_campaign'],
    promptChips: ['Draft campaign copy', 'Prepare email sequence', 'Create WhatsApp variant'],
  },
  {
    id: 'proposal-cpq-specialist',
    name: 'Proposal and CPQ Specialist',
    promise: 'Draft quotes, package pricing, and upsell structures.',
    modules: ['crm', 'finance', 'sales'],
    allowedActionLevels: ['read', 'draft', 'guarded_write', 'restricted'],
    restrictedActions: ['approve_price_override', 'finalize_quote'],
    promptChips: ['Draft quote', 'Suggest upsell', 'Check pricing structure'],
  },
  {
    id: 'finance-assistant',
    name: 'Finance Assistant',
    promise: 'Summarize receivables and recommend collections actions.',
    modules: ['finance'],
    allowedActionLevels: ['read', 'draft', 'guarded_write', 'restricted'],
    restrictedActions: ['mark_payment_received', 'adjust_invoice_total'],
    promptChips: ['Recover overdue invoices', 'Summarize dues', 'Draft payment reminder'],
  },
  {
    id: 'gst-compliance-specialist',
    name: 'GST and Compliance Specialist',
    promise: 'Flag compliance gaps and GST-sensitive risks before action.',
    modules: ['finance', 'legal'],
    allowedActionLevels: ['read', 'draft', 'restricted'],
    restrictedActions: ['change_tax_treatment', 'file_compliance_action'],
    promptChips: ['Check GST readiness', 'Explain tax impact', 'Find compliance gaps'],
  },
  {
    id: 'workflow-specialist',
    name: 'Workflow Specialist',
    promise: 'Convert plain-language instructions into safe automations.',
    modules: ['automation', 'workflow', 'crm', 'finance', 'marketing', 'hr'],
    allowedActionLevels: ['read', 'draft', 'guarded_write', 'restricted'],
    restrictedActions: ['activate_workflow'],
    promptChips: ['Build nurture flow', 'Design approval workflow', 'Draft automation rules'],
  },
  {
    id: 'knowledge-specialist',
    name: 'Knowledge Specialist',
    promise: 'Answer from company docs and SOPs with citations.',
    modules: ['knowledge', 'crm', 'finance', 'marketing', 'hr', 'support', 'general'],
    allowedActionLevels: ['read'],
    promptChips: ['Summarize policy', 'Find SOP for this task', 'Show source-backed answer'],
  },
  {
    id: 'hr-operations-specialist',
    name: 'HR Operations Specialist',
    promise: 'Support leave, onboarding, policy, and HR ops actions.',
    modules: ['hr'],
    allowedActionLevels: ['read', 'draft', 'guarded_write', 'restricted'],
    restrictedActions: ['approve_leave', 'update_sensitive_hr_record'],
    promptChips: ['Draft onboarding checklist', 'Summarize leave status', 'Prepare HR reminder'],
  },
  {
    id: 'support-voice-specialist',
    name: 'Support and Voice Specialist',
    promise: 'Summarize calls, triage issues, and draft replies.',
    modules: ['communication', 'support', 'crm'],
    allowedActionLevels: ['read', 'draft', 'guarded_write', 'restricted'],
    restrictedActions: ['send_customer_reply'],
    promptChips: ['Summarize this call', 'Draft support reply', 'Triage open issue'],
  },
]

export function normalizeModule(module: string): string {
  const m = (module || 'general').toLowerCase()
  if (m === 'home') return 'crm'
  if (m === 'workflows') return 'workflow'
  if (m === 'communications') return 'communication'
  return m
}

export function getSpecialistById(id: string): SpecialistDefinition | undefined {
  return SPECIALISTS.find((specialist) => specialist.id === id)
}

export function listSpecialistsForModule(module: string): SpecialistDefinition[] {
  const normalized = normalizeModule(module)
  return SPECIALISTS.filter((specialist) => specialist.modules.includes(normalized))
}

