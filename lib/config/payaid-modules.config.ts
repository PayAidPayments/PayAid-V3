import { buildCanonicalModuleUrl, buildCanonicalModuleUrlWithSSO } from '@/lib/utils/canonical-module-url'

/**
 * PayAid V3 — Single source of truth for module registry.
 * Replaces scattered definitions in modules.config.ts and moduleRegistry.ts for navigation.
 *
 * - tier: 'primary' → shown in Module Switcher as icon+label tiles
 * - tier: 'secondary' → shown in "More Apps" launcher (grouped)
 * - tier: 'ai' → under AI group in More Apps (or as primary "AI" tile that opens AI Studio)
 *
 * Each module's layout reads nav from lib/{module}/{module}-top-bar-items.ts
 * (see navConfigPath or convention: lib/crm/crm-top-bar-items.ts, etc.)
 */

export type ModuleTier = 'primary' | 'secondary' | 'ai'

/**
 * Nav honesty: only `shown` modules appear in Module Switcher.
 * Hidden modules keep routes/licenses for deep links and redirects,
 * but must not clutter operator navigation until the workflow is real.
 */
export type ModuleNavVisibility = 'shown' | 'hidden'

export type SecondaryGroup =
  | 'growth'
  | 'ai'
  | 'communication'
  | 'productivity'
  | 'intelligence'
  | 'operations'
  | 'support'

export interface PayAidModuleConfig {
  id: string
  label: string
  description: string
  basePath: string
  tier: ModuleTier
  /** Lucide icon name (e.g. 'Users', 'IndianRupee') */
  icon: string
  /** For secondary tier: which group in More Apps */
  secondaryGroup?: SecondaryGroup
  /** Home route suffix after basePath/tenantId (default 'Home') */
  homeSegment?: string
  /** Default `shown`. Use `hidden` for placeholders, duplicates, and demo-only shells. */
  navVisibility?: ModuleNavVisibility
}

function isNavShown(mod: PayAidModuleConfig): boolean {
  return (mod.navVisibility ?? 'shown') === 'shown'
}

export const PAYAID_MODULES: PayAidModuleConfig[] = [
  // —— Tier 1: Primary (Module Switcher) ——
  {
    id: 'home',
    label: 'Home',
    description: 'Command Center & cross-module dashboard',
    basePath: '/home',
    tier: 'primary',
    icon: 'Home',
    homeSegment: '',
  },
  {
    id: 'crm',
    label: 'CRM & Sales',
    description: 'Leads, pipeline, pages, and revenue workflows',
    basePath: '/crm',
    tier: 'primary',
    icon: 'Users',
  },
  {
    id: 'lead-intelligence',
    label: 'Lead Intelligence',
    description: 'Standalone discovery product (provider-first; not CRM)',
    basePath: '/lead-intelligence',
    tier: 'secondary',
    icon: 'Search',
    secondaryGroup: 'growth',
    // Keep module structure + deep links; hide from prod nav until provider-first discovery is real
    navVisibility: 'hidden',
  },
  {
    id: 'sales',
    label: 'Sales Pages',
    description: 'Funnels, landing pages, and checkout',
    basePath: '/sales',
    tier: 'secondary',
    icon: 'ShoppingCart',
    secondaryGroup: 'growth',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Campaigns, creative & social',
    basePath: '/marketing',
    tier: 'primary',
    icon: 'Megaphone',
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Invoices, GST & accounting',
    basePath: '/finance',
    tier: 'primary',
    icon: 'IndianRupee',
  },
  {
    id: 'hr',
    label: 'HR & Workforce',
    description: 'Employees, payroll, attendance, and training',
    basePath: '/hr',
    tier: 'primary',
    icon: 'UserCog',
  },
  {
    id: 'projects',
    label: 'Projects & Service',
    description: 'Project delivery, service jobs, and time tracking',
    basePath: '/projects',
    tier: 'primary',
    icon: 'FolderKanban',
  },
  {
    id: 'inventory',
    label: 'Operations',
    description: 'Inventory, suppliers, fulfillment, and assets',
    basePath: '/inventory',
    tier: 'primary',
    icon: 'Package',
  },
  {
    id: 'ai-studio',
    label: 'AI Workspace',
    description: 'AI assistant, advisors, insights, voice, and knowledge tools',
    basePath: '/ai-studio',
    tier: 'primary',
    icon: 'Sparkles',
  },

  // —— Tier 2: Secondary (More Apps) ——
  // AI group (also available as primary "AI" tile above)
  {
    id: 'ai-cofounder',
    label: 'AI Advisors',
    description: 'Business AI with specialist agents',
    basePath: '/ai-cofounder',
    tier: 'secondary',
    icon: 'Sparkles',
    secondaryGroup: 'ai',
    // Canonical entry is AI Workspace; keep route for deep links only
    navVisibility: 'hidden',
  },
  {
    id: 'ai-chat',
    label: 'AI Assistant',
    description: 'Conversational AI assistant',
    basePath: '/ai-chat',
    tier: 'secondary',
    icon: 'MessageSquare',
    secondaryGroup: 'ai',
    navVisibility: 'hidden',
  },
  {
    id: 'ai-insights',
    label: 'AI Insights',
    description: 'Business analysis & recommendations',
    basePath: '/ai-insights',
    tier: 'secondary',
    icon: 'Lightbulb',
    secondaryGroup: 'ai',
    navVisibility: 'hidden',
  },
  {
    id: 'website-builder',
    label: 'Website Builder',
    description: 'AI-powered websites',
    basePath: '/website-builder',
    tier: 'secondary',
    icon: 'Globe',
    secondaryGroup: 'ai',
  },
  {
    id: 'logo-generator',
    label: 'Logo Generator',
    description: 'AI logo creation',
    basePath: '/logo-generator',
    tier: 'secondary',
    icon: 'Palette',
    secondaryGroup: 'ai',
    navVisibility: 'hidden',
  },
  {
    id: 'knowledge-rag',
    label: 'Knowledge Assistant',
    description: 'Document Q&A with RAG',
    basePath: '/knowledge-rag',
    tier: 'secondary',
    icon: 'BookOpen',
    secondaryGroup: 'ai',
    navVisibility: 'hidden',
  },
  {
    id: 'voice-agents',
    label: 'Voice Agents',
    description: 'AI voice agents for calls',
    basePath: '/voice-agents',
    tier: 'secondary',
    icon: 'Phone',
    secondaryGroup: 'ai',
  },
  // Communication
  {
    id: 'communication',
    label: 'Communications Infrastructure',
    description: 'Shared messaging channels for campaigns, sales, and support',
    basePath: '/communication',
    tier: 'secondary',
    icon: 'MessageSquare',
    secondaryGroup: 'communication',
  },
  // Productivity
  {
    id: 'productivity',
    label: 'Workspace Tools',
    description: 'Sheets, Docs, Drive, Slides, Meet, and PDF tools',
    basePath: '/productivity',
    tier: 'secondary',
    icon: 'LayoutGrid',
    secondaryGroup: 'productivity',
  },
  {
    id: 'spreadsheet',
    label: 'PayAid Sheets',
    description: 'Spreadsheets & collaboration',
    basePath: '/spreadsheet',
    tier: 'secondary',
    icon: 'Table',
    secondaryGroup: 'productivity',
  },
  {
    id: 'docs',
    label: 'PayAid Docs',
    description: 'Documents & collaboration',
    basePath: '/docs',
    tier: 'secondary',
    icon: 'FileEdit',
    secondaryGroup: 'productivity',
    navVisibility: 'hidden',
  },
  {
    id: 'drive',
    label: 'PayAid Drive',
    description: 'Cloud storage',
    basePath: '/drive',
    tier: 'secondary',
    icon: 'Folder',
    secondaryGroup: 'productivity',
    navVisibility: 'hidden',
  },
  {
    id: 'meet',
    label: 'PayAid Meet',
    description: 'Video conferencing',
    basePath: '/meet',
    tier: 'secondary',
    icon: 'Video',
    secondaryGroup: 'productivity',
    navVisibility: 'hidden',
  },
  {
    id: 'pdf',
    label: 'PayAid PDF',
    description: 'PDF tools',
    basePath: '/pdf',
    tier: 'secondary',
    icon: 'FileText',
    secondaryGroup: 'productivity',
    navVisibility: 'hidden',
  },
  {
    id: 'slides',
    label: 'PayAid Slides',
    description: 'Presentations',
    basePath: '/slides',
    tier: 'secondary',
    icon: 'Presentation',
    secondaryGroup: 'productivity',
    navVisibility: 'hidden',
  },
  // Intelligence
  {
    id: 'industry-intelligence',
    label: 'Industry Intelligence',
    description: 'Market context inside analytics',
    basePath: '/industry-intelligence',
    tier: 'secondary',
    icon: 'TrendingUp',
    secondaryGroup: 'intelligence',
    navVisibility: 'hidden',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Reports & dashboards',
    basePath: '/analytics',
    tier: 'primary',
    icon: 'BarChart3',
  },
  // Operations
  {
    id: 'workflow-automation',
    label: 'Automation',
    description: 'Automation & orchestration',
    basePath: '/workflow-automation',
    tier: 'primary',
    icon: 'GitBranch',
  },
  {
    id: 'contracts',
    label: 'Documents & Contracts',
    description: 'Contracts, templates, and renewals',
    basePath: '/contracts',
    tier: 'primary',
    icon: 'FileText',
    // Partial lifecycle — hide until generation/approval/signature loop is real
    navVisibility: 'hidden',
  },
  {
    id: 'compliance',
    label: 'Compliance',
    description: 'Compliance & legal',
    basePath: '/compliance',
    tier: 'secondary',
    icon: 'ShieldCheck',
    secondaryGroup: 'operations',
    navVisibility: 'hidden',
  },
  {
    id: 'lms',
    label: 'LMS',
    description: 'Learning management',
    basePath: '/lms',
    tier: 'secondary',
    icon: 'GraduationCap',
    secondaryGroup: 'operations',
    navVisibility: 'hidden',
  },
  {
    id: 'appointments',
    label: 'Appointments',
    description: 'Scheduling & bookings',
    basePath: '/appointments',
    tier: 'secondary',
    icon: 'Calendar',
    secondaryGroup: 'operations',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Cross-module notification center',
    basePath: '/notifications',
    tier: 'secondary',
    icon: 'Bell',
    secondaryGroup: 'operations',
    homeSegment: '',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Tenant profile, users, billing',
    basePath: '/settings',
    tier: 'secondary',
    icon: 'Settings',
    secondaryGroup: 'operations',
    homeSegment: '',
  },
  // Support
  {
    id: 'support',
    label: 'Support',
    description: 'Tickets & chat',
    basePath: '/support',
    tier: 'primary',
    icon: 'Headphones',
    // Spine lives inside CRM/comms for now — hide standalone Support tile
    navVisibility: 'hidden',
  },
  {
    id: 'help-center',
    label: 'Help Center',
    description: 'Knowledge base',
    basePath: '/help-center',
    tier: 'secondary',
    icon: 'BookOpen',
    secondaryGroup: 'support',
    navVisibility: 'hidden',
  },
]

const SECONDARY_GROUP_LABELS: Record<SecondaryGroup, string> = {
  growth: 'CRM & Sales Features',
  ai: 'AI Workspace Tools',
  communication: 'Platform Capabilities',
  productivity: 'Workspace Tools',
  intelligence: 'Analytics Extensions',
  operations: 'Platform Operations',
  support: 'Support Extensions',
}

export function getPrimaryModules(): PayAidModuleConfig[] {
  return PAYAID_MODULES.filter((m) => m.tier === 'primary' && isNavShown(m))
}

export function getSecondaryModules(): PayAidModuleConfig[] {
  return PAYAID_MODULES.filter((m) => m.tier === 'secondary' && isNavShown(m))
}

export function getSecondaryModulesByGroup(): Record<SecondaryGroup, PayAidModuleConfig[]> {
  const groups = {} as Record<SecondaryGroup, PayAidModuleConfig[]>
  const groupOrder: SecondaryGroup[] = [
    'growth',
    'ai',
    'communication',
    'productivity',
    'intelligence',
    'operations',
    'support',
  ]
  for (const g of groupOrder) {
    groups[g] = PAYAID_MODULES.filter(
      (m) => m.tier === 'secondary' && m.secondaryGroup === g && isNavShown(m)
    )
  }
  return groups
}

export function getSecondaryGroupLabel(group: SecondaryGroup): string {
  return SECONDARY_GROUP_LABELS[group]
}

export function getModuleById(id: string): PayAidModuleConfig | undefined {
  return PAYAID_MODULES.find((m) => m.id === id)
}

/** Build module home URL: e.g. /crm/{tenantRouteKey}/Home (canonical app origin when env is set). */
export function getModuleHomeUrl(moduleId: string, tenantRouteKey: string): string {
  const mod = getModuleById(moduleId)
  if (!mod) return `/home/${tenantRouteKey}`
  const segment = mod.homeSegment ?? 'Home'
  const path = mod.basePath.replace(/^\//, '')
  const pathname = segment ? `/${path}/${tenantRouteKey}/${segment}` : `/${path}/${tenantRouteKey}`

  if (
    moduleId === 'crm' ||
    moduleId === 'finance' ||
    moduleId === 'marketing' ||
    moduleId === 'hr' ||
    moduleId === 'projects' ||
    moduleId === 'sales' ||
    moduleId === 'website-builder' ||
    moduleId === 'voice-agents' ||
    moduleId === 'voice'
  ) {
    return buildCanonicalModuleUrlWithSSO(moduleId as any, pathname, tenantRouteKey)
  }

  if (moduleId === 'lead-intelligence' || moduleId === 'leads') {
    return buildCanonicalModuleUrlWithSSO('leads', `/lead-intelligence/${tenantRouteKey}/Home`, tenantRouteKey)
  }

  return pathname
}
