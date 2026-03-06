/**
 * AI Co-Founder – Specialist groups and one-line roles for the boardroom UI.
 * Groups agents into Strategy, Finance, Sales & Marketing, Operations & Industry.
 */

import type { AgentId } from './agents'

export type SpecialistCategory =
  | 'Strategy'
  | 'Finance'
  | 'Sales & Marketing'
  | 'Operations & Industry'

export interface SpecialistGroup {
  category: SpecialistCategory
  agentIds: AgentId[]
}

/** One-line role description and tooltip per agent (used when API doesn't provide enough) */
export const SPECIALIST_ROLES: Record<string, { role: string; tooltip: string }> = {
  cofounder: {
    role: 'Strategic partner – priorities, health, next steps',
    tooltip: 'Orchestrates all specialists. Helps with priorities, business health, and strategic decisions.',
  },
  finance: {
    role: 'Finance expert – P&L, runway, GST',
    tooltip: 'Helps you with pricing, burn rate, runway, profitability, and GST.',
  },
  sales: {
    role: 'Leads, deals, pipeline, follow-ups',
    tooltip: 'Pipeline analysis, at-risk deals, follow-up messages, rep performance.',
  },
  marketing: {
    role: 'Campaigns, ROI, leads, WhatsApp',
    tooltip: 'Campaign performance, lead sources, email/WhatsApp campaigns, lead leakage.',
  },
  website: {
    role: 'Landing pages, checkout, SEO',
    tooltip: 'Landing page and checkout improvements, SEO, conversion and bounce rate.',
  },
  hr: {
    role: 'Team, payroll, attendance, hiring',
    tooltip: 'Team performance, payroll risks, high performers, restructuring.',
  },
  restaurant: {
    role: 'Restaurant – menu, peak hours, turnover',
    tooltip: 'Revenue, table turnover, peak hours, menu performance, promotions.',
  },
  retail: {
    role: 'Retail – stock turns, SKUs, promotions',
    tooltip: 'Stock turns, SKU decisions, festival promotions, margins, clearance.',
  },
  manufacturing: {
    role: 'Production, bottlenecks, capacity',
    tooltip: 'Orders at risk, bottlenecks, material costs, capacity planning.',
  },
  'growth-strategist': {
    role: 'Growth and scaling',
    tooltip: 'Growth strategies, revenue paths, scaling and expansion.',
  },
  operations: {
    role: 'Process and efficiency',
    tooltip: 'Cost reduction, delays, bottlenecks, capacity planning.',
  },
  product: {
    role: 'Product and roadmap',
    tooltip: 'Product strategy, roadmap, and feature prioritization.',
  },
  'industry-expert': {
    role: 'Industry-specific advice',
    tooltip: 'Industry best practices and vertical-specific insights.',
  },
  analytics: {
    role: 'Analytics and BI',
    tooltip: 'Reports, funnels, and business intelligence.',
  },
  'customer-success': {
    role: 'Churn, renewals, health',
    tooltip: 'Churn prediction, renewals, customer health.',
  },
  compliance: {
    role: 'Compliance and filings',
    tooltip: 'Regulatory and filing compliance.',
  },
  fundraising: {
    role: 'Fundraising and investors',
    tooltip: 'Investor materials and fundraising strategy.',
  },
  'market-research': {
    role: 'Market and competition',
    tooltip: 'Market and competitive research.',
  },
  scaling: {
    role: 'Scaling operations',
    tooltip: 'Scaling teams, processes, and systems.',
  },
  'tech-advisor': {
    role: 'Tech and stack',
    tooltip: 'Technology and stack recommendations.',
  },
  design: {
    role: 'Design and UX',
    tooltip: 'Design and user experience.',
  },
  documentation: {
    role: 'Docs and processes',
    tooltip: 'Documentation and process docs.',
  },
  'email-parser': {
    role: 'Email parsing',
    tooltip: 'Parse and structure email content.',
  },
  'form-filler': {
    role: 'Form filling',
    tooltip: 'Auto-fill forms from context.',
  },
  'document-reviewer': {
    role: 'Document review',
    tooltip: 'Review and summarize documents.',
  },
}

/** Order of categories in the left panel */
export const SPECIALIST_CATEGORY_ORDER: SpecialistCategory[] = [
  'Strategy',
  'Finance',
  'Sales & Marketing',
  'Operations & Industry',
]

/** Map agent id → category for grouping */
export const AGENT_CATEGORY: Record<string, SpecialistCategory> = {
  cofounder: 'Strategy',
  'growth-strategist': 'Strategy',
  finance: 'Finance',
  sales: 'Sales & Marketing',
  marketing: 'Sales & Marketing',
  website: 'Sales & Marketing',
  hr: 'Operations & Industry',
  restaurant: 'Operations & Industry',
  retail: 'Operations & Industry',
  manufacturing: 'Operations & Industry',
  operations: 'Operations & Industry',
  product: 'Operations & Industry',
  'industry-expert': 'Operations & Industry',
  analytics: 'Operations & Industry',
  'customer-success': 'Operations & Industry',
  compliance: 'Operations & Industry',
  fundraising: 'Operations & Industry',
  'market-research': 'Operations & Industry',
  scaling: 'Operations & Industry',
  'tech-advisor': 'Operations & Industry',
  design: 'Operations & Industry',
  documentation: 'Operations & Industry',
  'email-parser': 'Operations & Industry',
  'form-filler': 'Operations & Industry',
  'document-reviewer': 'Operations & Industry',
}

export function getCategoryForAgent(agentId: string): SpecialistCategory {
  return AGENT_CATEGORY[agentId] ?? 'Operations & Industry'
}

export function getRoleForAgent(agentId: string): { role: string; tooltip: string } {
  return (
    SPECIALIST_ROLES[agentId] ?? {
      role: 'Business specialist',
      tooltip: 'Helps with your business data and decisions.',
    }
  )
}