/**
 * AI Co-Founder – Pre-built workflow templates per specialist.
 * One-click prompts that auto-fill context (tenant/time range comes from UI when sending).
 */

import type { AgentId } from './agents'

export interface WorkflowTemplate {
  id: string
  agentId: AgentId
  label: string
  description: string
  /** Prompt sent to the API; context (module, time range) is added by the request. */
  prompt: string
}

/** Templates by agent. Each specialist has 3–5 one-click workflows. */
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // CFO Agent
  {
    id: 'cfo-gst-reconciliation',
    agentId: 'finance',
    label: 'GST Reconciliation Report',
    description: 'Summary of GST liability and filing status',
    prompt: 'Generate a GST reconciliation report: list all relevant invoices and payments for the current period, compute GST liability, and highlight any mismatches or pending filings. Use my actual business data.',
  },
  {
    id: 'cfo-90day-cashflow',
    agentId: 'finance',
    label: '90-day Cash Flow Forecast',
    description: 'Projected cash position for the next 90 days',
    prompt: 'Create a 90-day cash flow forecast using my invoice, payment, and expense data. Show expected inflows and outflows by month, highlight any shortfall or surplus, and suggest actions to improve cash position. Use ₹ (INR) only.',
  },
  {
    id: 'cfo-margin-analysis',
    agentId: 'finance',
    label: 'Margin Analysis by Product',
    description: 'Profitability by product or service',
    prompt: 'Analyse margins by product or service: which offerings are most profitable and which are dragging margins? Use revenue and cost data. Suggest pricing or cost actions. Format currency in ₹.',
  },
  {
    id: 'cfo-overdue-summary',
    agentId: 'finance',
    label: 'Overdue Invoices & Actions',
    description: 'List overdue invoices and recommended actions',
    prompt: 'List all overdue invoices with amounts and days overdue. For each, suggest a concrete follow-up action (e.g. reminder, payment plan). Summarise total outstanding and priority order.',
  },
  // Sales Agent
  {
    id: 'sales-pipeline-health',
    agentId: 'sales',
    label: 'Pipeline Health Report',
    description: 'Deal stages, value, and conversion insights',
    prompt: 'Give me a pipeline health report: total value by stage, conversion rates between stages, average deal size, and where deals are getting stuck. Use my actual deal data. Include a table if possible.',
  },
  {
    id: 'sales-lost-deal-analysis',
    agentId: 'sales',
    label: 'Lost Deal Analysis',
    description: 'Why deals were lost and how to improve',
    prompt: 'Analyse my lost deals: list recent lost opportunities with reasons (if available), identify patterns, and recommend how to reduce loss rate or improve qualification. Use my CRM data.',
  },
  {
    id: 'sales-next-followups',
    agentId: 'sales',
    label: 'Next 10 Follow-ups',
    description: 'Top deals that need a follow-up now',
    prompt: 'List the next 10 deals that need a follow-up, ordered by priority. For each deal give: name, stage, value, last activity, and a suggested next action or message. Use my pipeline data.',
  },
  {
    id: 'sales-at-risk-deals',
    agentId: 'sales',
    label: 'At-Risk Deals',
    description: 'Deals that might slip or need attention',
    prompt: 'Identify at-risk deals: deals that have been in the same stage too long, or with no recent activity, or that might slip this month. For each, suggest one concrete action. Use my deal data.',
  },
  // HR Agent
  {
    id: 'hr-payroll-audit',
    agentId: 'hr',
    label: 'Payroll Audit Checklist',
    description: 'Checklist for payroll compliance and accuracy',
    prompt: 'Generate a payroll audit checklist for this month: items to verify (attendance, leave, deductions, tax, disbursals), and any anomalies or risks from my HR/payroll data. Be specific to my business.',
  },
  {
    id: 'hr-team-scorecard',
    agentId: 'hr',
    label: 'Team Performance Scorecard',
    description: 'Performance and workload summary by team/person',
    prompt: 'Create a team performance scorecard: who is over- or under-loaded, attendance and leave trends, and any employees or teams that need attention. Use my HR and performance data.',
  },
  {
    id: 'hr-leave-balance',
    agentId: 'hr',
    label: 'Leave Balance Summary',
    description: 'Current leave balances across the team',
    prompt: 'Summarise leave balances for the team: current balance by type (e.g. casual, sick), who has low balance or excess, and any upcoming leave that might affect capacity. Use my HR data.',
  },
  {
    id: 'hr-high-performers',
    agentId: 'hr',
    label: 'High Performers & Recognition',
    description: 'Identify top performers and reward ideas',
    prompt: 'Identify consistently high performers from my data and suggest how to recognise or reward them. Also flag anyone who might need support or coaching. Be specific and actionable.',
  },
  // Co-Founder / Strategy
  {
    id: 'cofounder-weekly-priorities',
    agentId: 'cofounder',
    label: 'This Week’s Priorities',
    description: 'Top actions to focus on this week',
    prompt: 'Based on my business data (CRM, finance, HR), what should I focus on this week? Give 5–7 concrete priorities with a one-line reason each. Be specific and data-driven.',
  },
  {
    id: 'cofounder-business-health',
    agentId: 'cofounder',
    label: 'Business Health Snapshot',
    description: 'Revenue, pipeline, and key risks in one view',
    prompt: 'Give me a business health snapshot: revenue trend, pipeline value, overdue items, and top 3 risks or opportunities right now. Use my actual data. Format currency in ₹.',
  },
  {
    id: 'cofounder-action-plan',
    agentId: 'cofounder',
    label: '30-Day Action Plan',
    description: 'Structured plan for the next 30 days',
    prompt: 'Create a 30-day action plan based on my current deals, invoices, and tasks. Group by area (sales, finance, ops) and suggest specific actions with rough timing. Use my data only.',
  },
]

/** Get templates for an agent. Co-founder also gets cofounder-only templates. */
export function getTemplatesForAgent(agentId: AgentId): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter((t) => t.agentId === agentId)
}

/** Get all templates grouped by agent (for sidebar). */
export function getTemplatesByAgent(): Record<AgentId, WorkflowTemplate[]> {
  const byAgent: Record<string, WorkflowTemplate[]> = {}
  for (const t of WORKFLOW_TEMPLATES) {
    if (!byAgent[t.agentId]) byAgent[t.agentId] = []
    byAgent[t.agentId].push(t)
  }
  return byAgent as Record<AgentId, WorkflowTemplate[]>
}
