import { ALL_LICENSE_MODULE_IDS } from '@/lib/modules/catalog'

export type CanonicalLicenseModuleCategory = 'suite' | 'feature' | 'capability'

export type CanonicalLicenseModuleDefinition = {
  id: string
  name: string
  description: string
  category: CanonicalLicenseModuleCategory
}

export const LICENSE_MODULE_DEFINITIONS: Record<string, CanonicalLicenseModuleDefinition> = {
  crm: {
    id: 'crm',
    name: 'CRM & Sales',
    description: 'Leads, contacts, deals, appointments, and revenue workflows',
    category: 'suite',
  },
  sales: {
    id: 'sales',
    name: 'Sales Pages',
    description: 'Funnels, pages, and checkout surfaces for CRM & Sales',
    category: 'feature',
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing',
    description: 'Campaigns, audience segments, and acquisition channels',
    category: 'suite',
  },
  finance: {
    id: 'finance',
    name: 'Finance',
    description: 'Invoicing, collections, accounting ledger, and GST flows',
    category: 'suite',
  },
  hr: {
    id: 'hr',
    name: 'HR & Workforce',
    description: 'Employees, payroll, leave, attendance, and workforce operations',
    category: 'suite',
  },
  communication: {
    id: 'communication',
    name: 'Support',
    description: 'Support and communication infrastructure across channels',
    category: 'suite',
  },
  'ai-studio': {
    id: 'ai-studio',
    name: 'AI Workspace',
    description: 'Assistant, advisors, insights, voice, and knowledge tools',
    category: 'suite',
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    description: 'Dashboards, reporting, and decision intelligence',
    category: 'suite',
  },
  projects: {
    id: 'projects',
    name: 'Projects & Service',
    description: 'Projects, service delivery, and workflow orchestration',
    category: 'suite',
  },
  inventory: {
    id: 'inventory',
    name: 'Operations',
    description: 'Inventory, suppliers, and fulfillment operations',
    category: 'suite',
  },
}

export function getCanonicalLicenseModules() {
  return ALL_LICENSE_MODULE_IDS.map((id) => LICENSE_MODULE_DEFINITIONS[id])
}
