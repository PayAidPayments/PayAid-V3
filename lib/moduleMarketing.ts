/**
 * Public marketing copy + signup defaults for module landing pages (`/modules/[slug]`).
 * `defaultSelectedModules` must use ids from `lib/modules/catalog.ts` (license API).
 * UI may use names like "Sales Studio"; license id for sales pages remains `sales`.
 */

import { filterToCatalogModules, type SignupPlanType } from '@/lib/modules/catalog'
import { PAYAID_MODULES } from '@/lib/config/payaid-modules.config'

export type ModuleLandingConfig = {
  slug: string
  name: string
  tagline: string
  description: string
  heroBenefits: readonly string[]
  defaultPlanType: SignupPlanType
  /** License ids persisted on signup; filtered to catalog server-side too */
  defaultSelectedModules: readonly string[]
}

export const MODULE_MARKETING: ModuleLandingConfig[] = [
  {
    slug: 'crm',
    name: 'CRM',
    tagline: 'Every lead, deal, and customer in one place.',
    description: 'Pipeline, activities, WhatsApp context, and AI next-actions for Indian SMBs.',
    heroBenefits: [
      'Kanban pipeline with clear stages',
      'Lead scoring and follow-up reminders',
      'Owner-friendly revenue snapshot',
    ],
    defaultPlanType: 'single',
    defaultSelectedModules: ['crm'],
  },
  {
    slug: 'marketing',
    name: 'Marketing',
    tagline: 'Campaigns across email, WhatsApp, and social.',
    description: 'Creative studio, scheduling, and AI content tuned for your brand.',
    heroBenefits: ['Journey-style campaigns', 'Social + WhatsApp in one hub', 'AI copy, images, and video helpers'],
    defaultPlanType: 'single',
    defaultSelectedModules: ['marketing'],
  },
  {
    slug: 'finance',
    name: 'Finance',
    tagline: 'Invoices, GST, payments, and books.',
    description: 'Raise invoices, track collections, and stay compliant without spreadsheet chaos.',
    heroBenefits: ['GST-ready invoicing', 'Payment links & reconciliation', 'Expense and vendor tracking'],
    defaultPlanType: 'single',
    defaultSelectedModules: ['finance'],
  },
  {
    slug: 'hr',
    name: 'HR',
    tagline: 'People, payroll, attendance, and compliance.',
    description: 'From onboarding to payroll runs — built for distributed and retail teams.',
    heroBenefits: ['Employee records & documents', 'Payroll cycles & payslips', 'Attendance and leave'],
    defaultPlanType: 'single',
    defaultSelectedModules: ['hr'],
  },
  {
    slug: 'sales',
    name: 'Sales & checkout',
    tagline: 'Landing pages, offers, and paid checkout.',
    description: 'Sell products and services with hosted pages connected to your stack.',
    heroBenefits: ['Fast landing pages', 'Checkout flows', 'Order visibility'],
    defaultPlanType: 'single',
    defaultSelectedModules: ['sales'],
  },
  {
    slug: 'sales-studio',
    name: 'Sales Studio',
    tagline: 'Pipelines and rep workflows (Frappe Sales Studio).',
    description:
      'Deep sales motions live in Sales Studio while core CRM stays on Espo — one login across PayAid.',
    heroBenefits: ['Pipeline views for reps', 'Sequences & forecasting', 'Works alongside core CRM'],
    defaultPlanType: 'single',
    defaultSelectedModules: ['sales'],
  },
  {
    slug: 'inventory',
    name: 'Inventory',
    tagline: 'Stock, warehouses, and catalog sync.',
    description: 'Know what you have, where it is, and when to reorder.',
    heroBenefits: ['Multi-location stock', 'Product masters', 'Movement history'],
    defaultPlanType: 'single',
    defaultSelectedModules: ['inventory'],
  },
  {
    slug: 'projects',
    name: 'Projects',
    tagline: 'Deliver work on time with tasks and timelines.',
    description: 'Projects, tasks, and collaboration without a separate PM tool.',
    heroBenefits: ['Task boards & milestones', 'Time and delivery tracking', 'Cross-team visibility'],
    defaultPlanType: 'single',
    defaultSelectedModules: ['projects'],
  },
  {
    slug: 'ai-studio',
    name: 'AI Studio',
    tagline: 'Co-founder, chat, insights, and creative AI.',
    description: 'Specialist agents for finance, HR, marketing, and day-to-day decisions.',
    heroBenefits: ['Multi-agent co-founder', 'Chat and insights', 'Brand-safe creative helpers'],
    defaultPlanType: 'single',
    defaultSelectedModules: ['ai-studio'],
  },
  {
    slug: 'analytics',
    name: 'Analytics',
    tagline: 'Dashboards that match your operations.',
    description: 'Cross-module metrics so owners see cash, pipeline, and workload together.',
    heroBenefits: ['Role-aware summaries', 'Trend views', 'Export-friendly reporting'],
    defaultPlanType: 'single',
    defaultSelectedModules: ['analytics'],
  },
  {
    slug: 'communication',
    name: 'Communication',
    tagline: 'Email, chat, SMS, and WhatsApp threads.',
    description: 'Keep conversations next to CRM and support context.',
    heroBenefits: ['Threaded comms', 'Templates & macros', 'Hooks into CRM and marketing'],
    defaultPlanType: 'single',
    defaultSelectedModules: ['communication'],
  },
  {
    slug: 'invoicing',
    name: 'Invoicing',
    tagline: 'Get paid faster with professional invoices.',
    description: 'Focused on billing flows — part of the Finance module on the platform.',
    heroBenefits: ['Recurring invoices', 'Reminders', 'Payment tracking'],
    defaultPlanType: 'single',
    defaultSelectedModules: ['finance'],
  },
  {
    slug: 'accounting',
    name: 'Accounting & GST',
    tagline: 'Books, taxes, and compliance in one lane.',
    description: 'Ledger-minded workflows inside Finance — no duplicate accounting product.',
    heroBenefits: ['GST reporting mindset', 'Expense capture', 'Audit-friendly trails'],
    defaultPlanType: 'single',
    defaultSelectedModules: ['finance'],
  },
  {
    slug: 'suite',
    name: 'Full PayAid suite',
    tagline: 'Every core module on trial.',
    description: 'Best when you want to explore the whole operating system before you narrow down.',
    heroBenefits: ['All catalog modules enabled', 'Single tenant & login', 'Switch apps anytime in trial'],
    defaultPlanType: 'suite',
    defaultSelectedModules: [],
  },
  {
    slug: 'starter',
    name: 'Starter bundle',
    tagline: 'CRM + Finance for day-one revenue.',
    description: 'Sell and collect in the same workspace — ideal for services and small teams.',
    heroBenefits: ['Pipeline + invoices together', 'Lower trial friction', 'Upgrade modules anytime'],
    defaultPlanType: 'multi',
    defaultSelectedModules: ['crm', 'finance'],
  },
  {
    slug: 'growth',
    name: 'Growth bundle',
    tagline: 'CRM, Sales, Marketing, Finance.',
    description: 'Acquire, convert, and collect — the classic revenue quartet.',
    heroBenefits: ['End-to-end funnel', 'Campaigns + pipeline', 'Cash and GST in sync'],
    defaultPlanType: 'multi',
    defaultSelectedModules: ['crm', 'sales', 'marketing', 'finance'],
  },
  {
    slug: 'operations',
    name: 'Operations bundle',
    tagline: 'Projects, inventory, and HR.',
    description: 'For teams that deliver physical or service work at scale.',
    heroBenefits: ['Projects + stock visibility', 'People and payroll adjacent', 'Fewer disconnected tools'],
    defaultPlanType: 'multi',
    defaultSelectedModules: ['projects', 'inventory', 'hr'],
  },
  {
    slug: 'whatsapp',
    name: 'WhatsApp growth',
    tagline: 'Broadcasts and journeys on WhatsApp.',
    description: 'Marketing-led WhatsApp automation with CRM context.',
    heroBenefits: ['Template-ready sends', 'Conversation history', 'Works with CRM contacts'],
    defaultPlanType: 'single',
    defaultSelectedModules: ['marketing'],
  },
  {
    slug: 'social',
    name: 'Social & creative',
    tagline: 'Organic social and AI creative.',
    description: 'Plan posts, generate assets, and keep brand voice consistent.',
    heroBenefits: ['Studio workflows', 'AI images & copy', 'Channel-ready exports'],
    defaultPlanType: 'single',
    defaultSelectedModules: ['marketing'],
  },
  {
    slug: 'payroll',
    name: 'Payroll',
    tagline: 'Runs, compliance, and payslips.',
    description: 'Payroll-centric slice of HR for growing headcount.',
    heroBenefits: ['Payroll cycles', 'Employee self-serve artifacts', 'Audit trail'],
    defaultPlanType: 'single',
    defaultSelectedModules: ['hr'],
  },
  {
    slug: 'voice-ai',
    name: 'Voice & AI agents',
    tagline: 'Call workflows with AI assistance.',
    description: 'Voice experiences paired with AI Studio capabilities.',
    heroBenefits: ['Call flows', 'Transcripts & summaries', 'Tied to tenant data'],
    defaultPlanType: 'multi',
    defaultSelectedModules: ['ai-studio', 'communication'],
  },
  {
    slug: 'documents',
    name: 'Docs & knowledge',
    tagline: 'Files, docs, and answers in one place.',
    description: 'Productivity-style work anchored on CRM and AI.',
    heroBenefits: ['Central knowledge', 'Faster answers', 'Less app switching'],
    defaultPlanType: 'multi',
    defaultSelectedModules: ['crm', 'ai-studio'],
  },
  {
    slug: 'workflow',
    name: 'Workflow & automation',
    tagline: 'Orchestrate handoffs across teams.',
    description: 'Projects plus communication for repeatable operations.',
    heroBenefits: ['Cross-team tasks', 'Notifications', 'Clear ownership'],
    defaultPlanType: 'multi',
    defaultSelectedModules: ['projects', 'communication'],
  },
  {
    slug: 'retail',
    name: 'Retail & POS',
    tagline: 'Sell in-store and online.',
    description: 'Sales checkout with inventory and finance alignment.',
    heroBenefits: ['Stock-aware selling', 'Payments', 'Simple multi-channel view'],
    defaultPlanType: 'multi',
    defaultSelectedModules: ['sales', 'inventory', 'finance'],
  },
  {
    slug: 'manufacturing',
    name: 'Manufacturing',
    tagline: 'BOMs, stock, and project delivery.',
    description: 'Inventory and projects combined for make-to-order teams.',
    heroBenefits: ['Stock visibility', 'Job tracking', 'Purchasing alignment'],
    defaultPlanType: 'multi',
    defaultSelectedModules: ['inventory', 'projects'],
  },
  {
    slug: 'services',
    name: 'Professional services',
    tagline: 'Win work, deliver, and invoice.',
    description: 'CRM + projects + finance for agencies and consultancies.',
    heroBenefits: ['Deals to delivery', 'Milestone billing', 'Utilization-friendly'],
    defaultPlanType: 'multi',
    defaultSelectedModules: ['crm', 'projects', 'finance'],
  },
  {
    slug: 'ecommerce',
    name: 'E-commerce',
    tagline: 'Catalog, checkout, and fulfilment.',
    description: 'Sales pages with inventory and money movement together.',
    heroBenefits: ['Product catalog', 'Checkout', 'Stock sync'],
    defaultPlanType: 'multi',
    defaultSelectedModules: ['sales', 'inventory', 'marketing'],
  },
  {
    slug: 'insights',
    name: 'Insights & BI',
    tagline: 'See performance without exporting sheets.',
    description: 'Analytics plus CRM and finance signals for owners.',
    heroBenefits: ['Cross-module KPIs', 'Faster decisions', 'Fewer spreadsheets'],
    defaultPlanType: 'multi',
    defaultSelectedModules: ['analytics', 'crm', 'finance'],
  },
  {
    slug: 'customer-hub',
    name: 'Customer hub',
    tagline: 'One profile across CRM and comms.',
    description: 'CRM with communication for support-heavy businesses.',
    heroBenefits: ['360° customer view', 'Threaded history', 'Faster resolutions'],
    defaultPlanType: 'multi',
    defaultSelectedModules: ['crm', 'communication'],
  },
  {
    slug: 'founder',
    name: 'Founder stack',
    tagline: 'CRM, marketing, finance, and AI.',
    description: 'Default-style bundle for founders who want breadth on day one.',
    heroBenefits: ['Acquire and retain', 'Invoice and track cash', 'AI copilots included'],
    defaultPlanType: 'multi',
    defaultSelectedModules: ['crm', 'marketing', 'finance', 'ai-studio'],
  },
]

export function getModuleBySlug(slug: string | null | undefined): ModuleLandingConfig | null {
  if (!slug) return null
  return MODULE_MARKETING.find((m) => m.slug === slug) ?? null
}

/** Query string for `/register` from a landing config (modules are catalog-filtered). */
export function buildRegisterHref(config: ModuleLandingConfig): string {
  const p = new URLSearchParams()
  p.set('planType', config.defaultPlanType)
  if (config.defaultPlanType !== 'suite') {
    const cleaned = filterToCatalogModules([...config.defaultSelectedModules])
    if (cleaned.length) p.set('modules', cleaned.join(','))
  }
  p.set('from', 'module')
  return `/register?${p.toString()}`
}

export function getModuleMarketingSlugs(): string[] {
  return MODULE_MARKETING.map((m) => m.slug)
}

/**
 * Maps `lib/modules.config` `id` values → `/modules/[slug]` for public landing CTAs.
 * Unknown ids fall back to `suite` when no specific page exists.
 */
const MODULE_CONFIG_ID_TO_MARKETING_SLUG: Record<string, string> = {
  crm: 'crm',
  sales: 'sales',
  marketing: 'marketing',
  finance: 'finance',
  projects: 'projects',
  hr: 'hr',
  communication: 'communication',
  marketplace: 'suite',
  'ai-studio': 'ai-studio',
  'ai-cofounder': 'ai-studio',
  'ai-chat': 'ai-studio',
  'ai-insights': 'insights',
  'website-builder': 'founder',
  'logo-generator': 'social',
  'knowledge-rag': 'documents',
  'voice-agents': 'voice-ai',
  analytics: 'analytics',
  'industry-intelligence': 'insights',
  appointments: 'services',
  inventory: 'inventory',
  workflow: 'workflow',
  'help-center': 'suite',
  contracts: 'services',
  productivity: 'founder',
  spreadsheet: 'founder',
  docs: 'documents',
  drive: 'documents',
  slides: 'documents',
  meet: 'communication',
  pdf: 'documents',
  restaurant: 'retail',
  retail: 'retail',
  service: 'services',
  ecommerce: 'ecommerce',
  manufacturing: 'manufacturing',
  'field-service': 'services',
  'asset-management': 'inventory',
  compliance: 'accounting',
  lms: 'founder',
  'professional-services': 'services',
  healthcare: 'founder',
  education: 'founder',
  'real-estate': 'founder',
  logistics: 'manufacturing',
  agriculture: 'founder',
  construction: 'manufacturing',
  beauty: 'founder',
  automotive: 'founder',
  hospitality: 'retail',
  legal: 'accounting',
  'financial-services': 'finance',
  events: 'services',
  wholesale: 'inventory',
}

export function getModuleMarketingHref(moduleId: string): string | null {
  const slug =
    MODULE_CONFIG_ID_TO_MARKETING_SLUG[moduleId] ??
    (MODULE_MARKETING.some((m) => m.slug === moduleId) ? moduleId : 'suite')
  return getModuleBySlug(slug) ? `/modules/${slug}` : null
}

/**
 * Public login URL from a module landing slug — after sign-in, user is routed into that product (if licensed).
 */
export function buildLoginHrefForMarketingSlug(slug: string): string {
  const mod = getModuleBySlug(slug)
  if (!mod) return '/login'

  if (mod.defaultPlanType === 'suite') {
    return `/login?redirect=${encodeURIComponent('/home')}`
  }

  if (mod.defaultPlanType === 'multi' && mod.defaultSelectedModules.length > 1) {
    return `/login?redirect=${encodeURIComponent('/home')}`
  }

  const licenseId =
    mod.defaultSelectedModules.length > 0 ? mod.defaultSelectedModules[0] : null
  if (!licenseId) {
    return '/login'
  }

  const pm = PAYAID_MODULES.find((m) => m.id === licenseId)
  const basePath = pm?.basePath ?? `/${licenseId}`
  return `/login?redirect=${encodeURIComponent(basePath)}`
}
