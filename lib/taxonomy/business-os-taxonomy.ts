export type BusinessSuiteId =
  | 'crm-sales'
  | 'marketing'
  | 'finance'
  | 'operations'
  | 'projects-service'
  | 'hr-workforce'
  | 'support'
  | 'documents-contracts'
  | 'analytics'
  | 'automation'
  | 'ai-workspace'

export type SurfaceType =
  | 'suite'
  | 'feature'
  | 'platform-capability'
  | 'industry-solution'
  | 'workspace-tool'

export const TOP_LEVEL_BUSINESS_SUITES: ReadonlyArray<{ id: BusinessSuiteId; label: string }> = [
  { id: 'crm-sales', label: 'CRM & Sales' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'finance', label: 'Finance' },
  { id: 'operations', label: 'Operations' },
  { id: 'projects-service', label: 'Projects & Service' },
  { id: 'hr-workforce', label: 'HR & Workforce' },
  { id: 'support', label: 'Support' },
  { id: 'documents-contracts', label: 'Documents & Contracts' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'automation', label: 'Automation' },
  { id: 'ai-workspace', label: 'AI Workspace' },
]

export const PLATFORM_CAPABILITIES = [
  'App Store',
  'Communications Infrastructure',
  'Identity & Roles',
  'Tenant Settings',
  'Search & Command Center',
  'Notification Infrastructure',
  'Knowledge Infrastructure',
  'File Processing',
] as const

export const WORKSPACE_TOOLS = ['Sheets', 'Docs', 'Drive', 'Slides', 'Meet', 'PDF'] as const

export const INDUSTRY_SOLUTIONS = [
  'Restaurant',
  'Retail',
  'Manufacturing',
  'Healthcare',
  'Education',
  'Real Estate',
  'Service Businesses',
  'E-Commerce',
  'Logistics & Transportation',
  'Agriculture & Farming',
  'Construction & Contracting',
  'Beauty & Wellness',
  'Automotive & Repair',
  'Hospitality & Hotels',
  'Legal Services',
  'Financial Services',
  'Event Management',
  'Wholesale & Distribution',
] as const

/**
 * Canonical ownership mapping for existing module ids.
 * This keeps route/license ids stable while allowing a cleaner Business OS taxonomy.
 */
export const MODULE_SURFACE_OWNERSHIP: Record<
  string,
  { suite: BusinessSuiteId; surface: SurfaceType; label: string }
> = {
  crm: { suite: 'crm-sales', surface: 'suite', label: 'CRM & Sales' },
  sales: { suite: 'crm-sales', surface: 'feature', label: 'Sales Pages' },
  marketing: { suite: 'marketing', surface: 'suite', label: 'Marketing' },
  finance: { suite: 'finance', surface: 'suite', label: 'Finance' },
  inventory: { suite: 'operations', surface: 'feature', label: 'Inventory Management' },
  projects: { suite: 'projects-service', surface: 'suite', label: 'Projects & Service' },
  hr: { suite: 'hr-workforce', surface: 'suite', label: 'HR & Workforce' },
  support: { suite: 'support', surface: 'suite', label: 'Support' },
  'help-center': { suite: 'support', surface: 'feature', label: 'Help Center' },
  contracts: {
    suite: 'documents-contracts',
    surface: 'suite',
    label: 'Documents & Contracts',
  },
  analytics: { suite: 'analytics', surface: 'suite', label: 'Analytics' },
  'industry-intelligence': {
    suite: 'analytics',
    surface: 'feature',
    label: 'Industry Intelligence',
  },
  workflow: { suite: 'automation', surface: 'suite', label: 'Automation' },
  'workflow-automation': { suite: 'automation', surface: 'suite', label: 'Automation' },
  'ai-studio': { suite: 'ai-workspace', surface: 'suite', label: 'AI Workspace' },
  'ai-cofounder': { suite: 'ai-workspace', surface: 'feature', label: 'AI Advisors' },
  'ai-chat': { suite: 'ai-workspace', surface: 'feature', label: 'AI Assistant' },
  'ai-insights': { suite: 'ai-workspace', surface: 'feature', label: 'AI Insights' },
  'knowledge-rag': { suite: 'ai-workspace', surface: 'feature', label: 'Knowledge Assistant' },
  'voice-agents': { suite: 'ai-workspace', surface: 'feature', label: 'Voice Agents' },
  'website-builder': { suite: 'marketing', surface: 'feature', label: 'AI Website Builder' },
  'logo-generator': { suite: 'ai-workspace', surface: 'feature', label: 'AI Brand Tools' },
  productivity: { suite: 'operations', surface: 'workspace-tool', label: 'Workspace Tools' },
  spreadsheet: { suite: 'operations', surface: 'workspace-tool', label: 'Sheets' },
  docs: { suite: 'operations', surface: 'workspace-tool', label: 'Docs' },
  drive: { suite: 'operations', surface: 'workspace-tool', label: 'Drive' },
  slides: { suite: 'operations', surface: 'workspace-tool', label: 'Slides' },
  meet: { suite: 'operations', surface: 'workspace-tool', label: 'Meet' },
  pdf: { suite: 'operations', surface: 'workspace-tool', label: 'PDF' },
  marketplace: { suite: 'operations', surface: 'platform-capability', label: 'App Store' },
  communication: {
    suite: 'marketing',
    surface: 'platform-capability',
    label: 'Communications Infrastructure',
  },
  compliance: {
    suite: 'documents-contracts',
    surface: 'platform-capability',
    label: 'Compliance & Risk',
  },
  lms: { suite: 'hr-workforce', surface: 'feature', label: 'Training' },
  appointments: { suite: 'crm-sales', surface: 'feature', label: 'Appointments' },
}
