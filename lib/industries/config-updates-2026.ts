/**
 * Industry Configuration Updates for 2026 Revised Recommendations
 * This file contains the updates needed for lib/industries/config.ts
 * 
 * Key Changes:
 * 1. Marketing & AI Content added to all industries (now base)
 * 2. Time Tracking & Billing added to service industries
 * 3. POS & Sales added to retail-like industries
 * 4. Compliance modules added to regulated industries
 */

export const INDUSTRY_CONFIG_UPDATES_2026 = {
  // Service Industries - Add Time Tracking & Billing
  freelancer: {
    coreModules: ['crm', 'finance', 'marketing', 'communication', 'analytics', 'productivity', 'time-tracking'],
  },
  'service-business': {
    coreModules: ['crm', 'finance', 'marketing', 'hr', 'communication', 'analytics', 'productivity', 'time-tracking'],
  },
  'professional-services': {
    coreModules: ['crm', 'finance', 'marketing', 'hr', 'communication', 'analytics', 'productivity', 'time-tracking'],
  },
  healthcare: {
    coreModules: ['crm', 'finance', 'marketing', 'hr', 'communication', 'analytics', 'productivity', 'time-tracking', 'patient-management'],
  },

  // Retail-Like Industries - Add POS & Sales, Marketing
  retail: {
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'sales', 'pos', 'analytics', 'productivity'],
  },
  restaurant: {
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'sales', 'pos', 'hr', 'communication', 'analytics'],
  },
  beauty: {
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'sales', 'pos', 'hr', 'communication', 'analytics'],
  },
  ecommerce: {
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'sales', 'analytics', 'productivity'],
  },

  // Regulated Industries - Add Compliance Modules
  education: {
    coreModules: ['crm', 'finance', 'marketing', 'hr', 'communication', 'analytics', 'productivity', 'student-management'],
  },
  legal: {
    coreModules: ['crm', 'finance', 'marketing', 'communication', 'analytics', 'productivity', 'time-tracking', 'case-management'],
  },
  'financial-services': {
    coreModules: ['crm', 'finance', 'marketing', 'communication', 'analytics', 'productivity', 'compliance-monitoring'],
  },

  // Manufacturing & Supply Chain
  manufacturing: {
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'hr', 'communication', 'analytics', 'productivity', 'production-planning'],
  },
  wholesale: {
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'communication', 'analytics', 'productivity', 'b2b-portal'],
  },

  // Other Industries
  'real-estate': {
    coreModules: ['crm', 'finance', 'marketing', 'communication', 'analytics', 'productivity'],
  },
  construction: {
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'hr', 'communication', 'analytics', 'productivity'],
  },
  logistics: {
    coreModules: ['crm', 'finance', 'marketing', 'communication', 'analytics', 'productivity', 'fleet-management'],
  },
  hospitality: {
    coreModules: ['crm', 'finance', 'marketing', 'hr', 'communication', 'analytics', 'productivity', 'pms'],
  },
  automotive: {
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'communication', 'analytics', 'productivity', 'service-management'],
  },
  agriculture: {
    coreModules: ['crm', 'finance', 'marketing', 'inventory', 'communication', 'analytics', 'productivity', 'crop-management'],
  },
  'event-management': {
    coreModules: ['crm', 'finance', 'marketing', 'communication', 'analytics', 'productivity'],
  },
}

/**
 * Industry-specific add-ons per revised recommendations
 */
export const INDUSTRY_ADDONS_2026 = {
  freelancer: [
    'service-portfolio-management',
    'proposal-builder',
    'automated-invoicing',
  ],
  'service-business': [
    'capacity-planning',
    'proposal-contract-management',
    'client-portal',
  ],
  'professional-services': [
    'case-matter-management',
    'compliance-audit-trails',
    'document-management',
  ],
  retail: [
    'omnichannel-loyalty',
    'dynamic-pricing',
    'clv-prediction',
    'email-marketing-automation',
  ],
  restaurant: [
    'kitchen-display-system',
    'supplier-po-management',
    'delivery-integration',
    'reservation-management',
    'loyalty-program',
  ],
  healthcare: [
    'patient-portal',
    'automated-reminders',
    'prescription-management',
    'insurance-claims',
    'hipaa-compliance',
  ],
  education: [
    'lms',
    'grade-management',
    'parent-portal',
    'financial-aid-tracking',
    'behavior-tracking',
  ],
  legal: [
    'document-template-library',
    'client-portal',
    'compliance-audit-trails',
  ],
  'financial-services': [
    'portfolio-tracking',
    'compliance-monitoring',
    'workflow-automation',
    'client-portal',
    'document-management',
  ],
  manufacturing: [
    'supply-chain-visibility',
    'quality-control',
    'equipment-maintenance',
    'supplier-lead-time',
  ],
  wholesale: [
    'po-automation',
    'supplier-performance-tracking',
    'customer-segmentation',
    'email-marketing',
  ],
}
