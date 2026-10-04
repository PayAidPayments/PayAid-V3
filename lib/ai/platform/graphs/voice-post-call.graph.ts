import type { GraphWorkflowDefinition } from './types'

/**
 * First LangGraph migration candidate — shadow mode in workflow registry.
 * Nodes: ingress → summarize → risk_check → plan_actions → approval → execute_tools → audit
 */
export const VOICE_POST_CALL_GRAPH: GraphWorkflowDefinition = {
  id: 'voice.post-call-triage',
  version: '0.1.0',
  checkpointEnabled: true,
  nodes: [
    { id: 'ingress', kind: 'ingress', description: 'Normalize transcript + policy scan' },
    { id: 'summarize', kind: 'plan', description: 'Extract intents and entities' },
    { id: 'risk_check', kind: 'risk_check', description: 'Safety and compliance labels' },
    { id: 'reflect', kind: 'reflect', description: 'Second-pass completeness check' },
    { id: 'plan_actions', kind: 'plan', description: 'Propose CRM tasks / follow-ups' },
    { id: 'approval', kind: 'approval', description: 'Human approval for writes', requiresApproval: true },
    { id: 'execute_tools', kind: 'tool', description: 'Execute approved tools only' },
    { id: 'compose', kind: 'compose', description: 'Final operator-facing summary' },
    { id: 'audit', kind: 'audit', description: 'Emit ai_trace record' },
  ],
  edges: [
    { from: 'ingress', to: 'summarize' },
    { from: 'summarize', to: 'risk_check' },
    { from: 'risk_check', to: 'reflect' },
    { from: 'reflect', to: 'plan_actions' },
    { from: 'plan_actions', to: 'approval', condition: 'has_write_actions' },
    { from: 'plan_actions', to: 'compose', condition: 'read_only' },
    { from: 'approval', to: 'execute_tools', condition: 'approved' },
    { from: 'execute_tools', to: 'compose' },
    { from: 'compose', to: 'audit' },
  ],
}
