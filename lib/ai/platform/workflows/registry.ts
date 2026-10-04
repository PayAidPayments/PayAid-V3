import type { WorkflowDefinition } from '../types'

export const WORKFLOW_REGISTRY: Record<string, WorkflowDefinition> = {
  'voice.post-call-triage': {
    id: 'voice.post-call-triage',
    name: 'Voice Post-Call Triage',
    owner: 'voice',
    version: '0.1.0',
    description: 'Stateful post-call summary, intent extraction, CRM task routing',
    surfaces: ['voice_transcript'],
    allowedTools: ['get_active_deals', 'get_churn_risk_customers'],
    approvalPolicyId: 'guarded-ops',
    promptTemplateIds: ['voice.agent'],
    orchestration: 'langgraph',
    auditSchemaVersion: 'ai-trace-v1',
    rollbackPlan: 'Disable graph node; fall back to transcript-only logging',
    status: 'shadow',
  },
  'cofounder.task-planning': {
    id: 'cofounder.task-planning',
    name: 'Co-Founder Task Planning',
    owner: 'ai-studio',
    version: '0.1.0',
    description: 'Multi-step planning with human approval before task creation',
    surfaces: ['cofounder'],
    allowedTools: ['get_revenue_summary', 'get_active_deals', 'get_pending_invoices'],
    approvalPolicyId: 'guarded-ops',
    promptTemplateIds: ['cofounder.base'],
    orchestration: 'langgraph',
    auditSchemaVersion: 'ai-trace-v1',
    rollbackPlan: 'Route to single-shot cofounder response',
    status: 'shadow',
  },
  'support.case-triage': {
    id: 'support.case-triage',
    name: 'Support Case Triage',
    owner: 'crm',
    version: '0.1.0',
    description: 'Email/chat triage, sentiment, suggested response draft',
    surfaces: ['email_automation', 'chat'],
    allowedTools: ['get_customer_segments'],
    approvalPolicyId: 'draft-first',
    promptTemplateIds: ['email.auto_response', 'sentiment.analyze'],
    orchestration: 'langchain',
    auditSchemaVersion: 'ai-trace-v1',
    rollbackPlan: 'Use legacy email auto-response route only',
    status: 'active',
  },
  'sentiment.analyze': {
    id: 'sentiment.analyze',
    name: 'Sentiment Analysis Chain',
    owner: 'crm',
    version: '1.0.0',
    description: 'Single-shot structured sentiment extraction',
    surfaces: ['sentiment'],
    allowedTools: [],
    approvalPolicyId: 'read-only',
    promptTemplateIds: ['sentiment.analyze'],
    orchestration: 'langchain',
    auditSchemaVersion: 'ai-trace-v1',
    status: 'active',
  },
}

export function getWorkflow(id: string, version?: string): WorkflowDefinition | undefined {
  const wf = WORKFLOW_REGISTRY[id]
  if (!wf) return undefined
  if (version && wf.version !== version) return undefined
  return wf
}

export function listWorkflows(): WorkflowDefinition[] {
  return Object.values(WORKFLOW_REGISTRY)
}

export function listWorkflowsForSurface(surface: WorkflowDefinition['surfaces'][number]): WorkflowDefinition[] {
  return listWorkflows().filter((w) => w.surfaces.includes(surface))
}
