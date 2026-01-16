/**
 * Industry Presets and Module Recommendations
 * Industry selection pre-selects modules and defaults, but doesn't lock the account
 */

export interface IndustryPreset {
  id: string
  name: string
  description: string
  baseModules: string[]
  recommendedModules: string[]
  industryPacks: string[]
  defaultGoals: string[]
  icon: string
}

export interface BusinessUnit {
  id: string
  name: string
  industryPacks: string[]
  location?: string
}

export const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    id: 'freelancer',
    name: 'Freelancer / Solo Consultant',
    description: 'Individual consultant or freelancer managing clients and projects',
    baseModules: ['crm', 'finance', 'communication', 'analytics', 'productivity'],
    recommendedModules: ['service-businesses', 'projects', 'time-tracking'],
    industryPacks: ['service-businesses'],
    defaultGoals: ['get-paid-faster', 'track-projects', 'manage-clients'],
    icon: '👤',
  },
  {
    id: 'service-business',
    name: 'Service Business',
    description: 'Agency, consultancy, or service provider',
    baseModules: ['crm', 'finance', 'marketing', 'hr', 'communication', 'analytics'],
    recommendedModules: ['service-businesses', 'projects', 'time-tracking'],
    industryPacks: ['service-businesses'],
    defaultGoals: ['get-paid-faster', 'track-projects', 'manage-team'],
    icon: '💼',
  },
  {
    id: 'retail',
    name: 'Retail Shop / Chain',
    description: 'Retail store or chain with physical locations',
    baseModules: ['crm', 'finance', 'inventory', 'sales', 'analytics'],
    recommendedModules: ['retail', 'pos', 'loyalty'],
    industryPacks: ['retail'],
    defaultGoals: ['manage-inventory', 'run-pos', 'track-sales'],
    icon: '🏪',
  },
  {
    id: 'restaurant',
    name: 'Restaurant / Café',
    description: 'Restaurant, café, or food service business',
    baseModules: ['crm', 'finance', 'inventory', 'sales', 'hr', 'analytics'],
    recommendedModules: ['restaurant', 'pos', 'kitchen-display'],
    industryPacks: ['restaurant'],
    defaultGoals: ['manage-orders', 'track-inventory', 'staff-scheduling'],
    icon: '🍽️',
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    description: 'Manufacturing company with production facilities',
    baseModules: ['crm', 'finance', 'inventory', 'hr', 'analytics'],
    recommendedModules: ['manufacturing', 'production', 'suppliers', 'qc'],
    industryPacks: ['manufacturing'],
    defaultGoals: ['manage-production', 'track-inventory', 'file-gst'],
    icon: '🏭',
  },
  {
    id: 'ecommerce',
    name: 'E-commerce / Online Store',
    description: 'Online store or marketplace seller',
    baseModules: ['crm', 'finance', 'inventory', 'sales', 'marketing', 'analytics'],
    recommendedModules: ['ecommerce', 'channels', 'marketplace-integration'],
    industryPacks: ['ecommerce'],
    defaultGoals: ['manage-orders', 'track-inventory', 'run-campaigns'],
    icon: '🛒',
  },
  {
    id: 'professional-services',
    name: 'Professional Services',
    description: 'CA firm, law firm, consulting, or professional practice',
    baseModules: ['crm', 'finance', 'hr', 'communication', 'analytics'],
    recommendedModules: ['service-businesses', 'projects', 'time-tracking', 'billing'],
    industryPacks: ['professional-services'],
    defaultGoals: ['track-time', 'bill-clients', 'manage-cases'],
    icon: '⚖️',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Clinic, hospital, or healthcare provider',
    baseModules: ['crm', 'finance', 'hr', 'communication', 'analytics'],
    recommendedModules: ['healthcare', 'appointments', 'patient-management'],
    industryPacks: ['healthcare'],
    defaultGoals: ['manage-appointments', 'track-patients', 'file-compliance'],
    icon: '🏥',
  },
  {
    id: 'education',
    name: 'Education',
    description: 'School, coaching center, or educational institution',
    baseModules: ['crm', 'finance', 'hr', 'communication', 'analytics'],
    recommendedModules: ['education', 'student-management', 'attendance'],
    industryPacks: ['education'],
    defaultGoals: ['manage-students', 'track-fees', 'staff-scheduling'],
    icon: '🎓',
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    description: 'Real estate agency or property management',
    baseModules: ['crm', 'finance', 'communication', 'analytics'],
    recommendedModules: ['real-estate', 'property-management', 'leads'],
    industryPacks: ['real-estate'],
    defaultGoals: ['manage-properties', 'track-leads', 'manage-tenants'],
    icon: '🏠',
  },
  {
    id: 'logistics',
    name: 'Logistics / Transportation',
    description: 'Logistics, shipping, or transportation company',
    baseModules: ['crm', 'finance', 'inventory', 'hr', 'analytics'],
    recommendedModules: ['logistics', 'fleet-management', 'tracking'],
    industryPacks: ['logistics'],
    defaultGoals: ['track-shipments', 'manage-fleet', 'file-gst'],
    icon: '🚚',
  },
  {
    id: 'construction',
    name: 'Construction',
    description: 'Construction company or contractor',
    baseModules: ['crm', 'finance', 'inventory', 'hr', 'projects', 'analytics'],
    recommendedModules: ['construction', 'projects', 'materials', 'labor'],
    industryPacks: ['construction'],
    defaultGoals: ['track-projects', 'manage-materials', 'file-gst'],
    icon: '🏗️',
  },
  {
    id: 'beauty',
    name: 'Beauty / Salon',
    description: 'Beauty salon, spa, or wellness center',
    baseModules: ['crm', 'finance', 'hr', 'communication', 'analytics'],
    recommendedModules: ['beauty', 'appointments', 'loyalty'],
    industryPacks: ['beauty'],
    defaultGoals: ['manage-appointments', 'track-inventory', 'loyalty-program'],
    icon: '💅',
  },
  {
    id: 'automotive',
    name: 'Automotive',
    description: 'Auto repair, dealership, or automotive service',
    baseModules: ['crm', 'finance', 'inventory', 'hr', 'analytics'],
    recommendedModules: ['automotive', 'service-management', 'parts'],
    industryPacks: ['automotive'],
    defaultGoals: ['manage-services', 'track-parts', 'customer-history'],
    icon: '🚗',
  },
  {
    id: 'hospitality',
    name: 'Hospitality',
    description: 'Hotel, resort, or hospitality business',
    baseModules: ['crm', 'finance', 'hr', 'communication', 'analytics'],
    recommendedModules: ['hospitality', 'bookings', 'guest-management'],
    industryPacks: ['hospitality'],
    defaultGoals: ['manage-bookings', 'track-guests', 'staff-scheduling'],
    icon: '🏨',
  },
  {
    id: 'legal',
    name: 'Legal',
    description: 'Law firm or legal practice',
    baseModules: ['crm', 'finance', 'hr', 'communication', 'analytics'],
    recommendedModules: ['legal', 'case-management', 'time-tracking'],
    industryPacks: ['legal'],
    defaultGoals: ['manage-cases', 'track-time', 'bill-clients'],
    icon: '⚖️',
  },
  {
    id: 'financial',
    name: 'Financial Services',
    description: 'CA firm, financial advisor, or accounting practice',
    baseModules: ['crm', 'finance', 'hr', 'communication', 'analytics'],
    recommendedModules: ['financial', 'client-management', 'compliance'],
    industryPacks: ['financial'],
    defaultGoals: ['manage-clients', 'file-compliance', 'track-time'],
    icon: '💰',
  },
  {
    id: 'event',
    name: 'Event Management',
    description: 'Event planning or management company',
    baseModules: ['crm', 'finance', 'hr', 'communication', 'analytics'],
    recommendedModules: ['event', 'project-management', 'vendor-management'],
    industryPacks: ['event'],
    defaultGoals: ['manage-events', 'track-budget', 'coordinate-vendors'],
    icon: '🎉',
  },
  {
    id: 'wholesale',
    name: 'Wholesale Distribution',
    description: 'Wholesale distributor or B2B supplier',
    baseModules: ['crm', 'finance', 'inventory', 'sales', 'analytics'],
    recommendedModules: ['wholesale', 'distribution', 'b2b-portal'],
    industryPacks: ['wholesale'],
    defaultGoals: ['manage-inventory', 'track-orders', 'manage-distributors'],
    icon: '📦',
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    description: 'Farm, agricultural business, or agri-supply',
    baseModules: ['crm', 'finance', 'inventory', 'hr', 'analytics'],
    recommendedModules: ['agriculture', 'crop-management', 'supply-chain'],
    industryPacks: ['agriculture'],
    defaultGoals: ['track-crops', 'manage-supplies', 'file-compliance'],
    icon: '🌾',
  },
]

export const BASE_MODULES = [
  'crm',
  'sales',
  'marketing',
  'finance',
  'hr',
  'communication',
  'ai-studio',
  'analytics',
  'invoicing',
  'accounting',
  'inventory',
  'productivity',
]

export const INDUSTRY_PACKS = [
  'restaurant',
  'retail',
  'manufacturing',
  'service-businesses',
  'ecommerce',
  'healthcare',
  'education',
  'real-estate',
  'logistics',
  'construction',
  'beauty',
  'automotive',
  'hospitality',
  'legal',
  'financial',
  'event',
  'wholesale',
  'agriculture',
]

export const BUSINESS_GOALS = [
  { id: 'get-paid-faster', label: 'Get paid faster', icon: '💰' },
  { id: 'track-projects', label: 'Track projects & time', icon: '⏱️' },
  { id: 'manage-inventory', label: 'Manage inventory', icon: '📦' },
  { id: 'run-pos', label: 'Run POS / billing counter', icon: '🧾' },
  { id: 'manage-production', label: 'Manage production', icon: '🏭' },
  { id: 'run-campaigns', label: 'Run marketing campaigns', icon: '📢' },
  { id: 'file-gst', label: 'File GST / compliance', icon: '📋' },
  { id: 'manage-orders', label: 'Manage orders', icon: '📝' },
  { id: 'track-sales', label: 'Track sales & revenue', icon: '📊' },
  { id: 'manage-team', label: 'Manage team & HR', icon: '👥' },
  { id: 'manage-clients', label: 'Manage clients & leads', icon: '🤝' },
  { id: 'staff-scheduling', label: 'Staff scheduling', icon: '📅' },
]

/**
 * Get recommended modules based on industry selection and goals
 */
export function getRecommendedModules(
  industryIds: string[],
  goals: string[],
  businessComplexity: 'single' | 'multiple-locations' | 'multiple-lines'
): {
  baseModules: string[]
  industryPacks: string[]
  recommendedModules: string[]
} {
  const selectedPresets = INDUSTRY_PRESETS.filter((p) => industryIds.includes(p.id))

  // Collect all recommended modules
  const allRecommendedModules = new Set<string>()
  const allIndustryPacks = new Set<string>()

  selectedPresets.forEach((preset) => {
    preset.recommendedModules.forEach((m) => allRecommendedModules.add(m))
    preset.industryPacks.forEach((p) => allIndustryPacks.add(p))
  })

  // Add modules based on goals
  if (goals.includes('get-paid-faster')) {
    allRecommendedModules.add('invoicing')
    allRecommendedModules.add('payment-links')
  }
  if (goals.includes('track-projects')) {
    allRecommendedModules.add('projects')
    allRecommendedModules.add('time-tracking')
  }
  if (goals.includes('manage-inventory')) {
    allRecommendedModules.add('inventory')
  }
  if (goals.includes('run-pos')) {
    allRecommendedModules.add('pos')
  }
  if (goals.includes('file-gst')) {
    allRecommendedModules.add('gst')
    allRecommendedModules.add('compliance')
  }

  // For multiple business lines, recommend multi-currency and advanced features
  if (businessComplexity === 'multiple-lines') {
    allRecommendedModules.add('multi-currency')
    allRecommendedModules.add('business-units')
  }

  return {
    baseModules: BASE_MODULES,
    industryPacks: Array.from(allIndustryPacks),
    recommendedModules: Array.from(allRecommendedModules),
  }
}

/**
 * Get preset by ID
 */
export function getPresetById(id: string): IndustryPreset | undefined {
  return INDUSTRY_PRESETS.find((p) => p.id === id)
}

/**
 * Get all presets
 */
export function getAllPresets(): IndustryPreset[] {
  return INDUSTRY_PRESETS
}

