/**
 * Voice Agent workflow (Agent Builder) types.
 * Stored in VoiceAgent.workflow as JSON.
 */

export type WorkflowNodeType =
  | 'greeting'
  | 'intent'
  | 'crm_lookup'
  | 'response'
  | 'actions'
  | 'end'

export interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  data?: Record<string, unknown>
  position?: { x: number; y: number }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
}

export interface VoiceAgentWorkflow {
  nodes: WorkflowNode[]
  edges?: WorkflowEdge[]
}

export const NODE_TYPE_LABELS: Record<WorkflowNodeType, string> = {
  greeting: 'Greeting (TTS)',
  intent: 'Intent (LLM)',
  crm_lookup: 'CRM Lookup',
  response: 'Response',
  actions: 'Actions',
  end: 'End / WhatsApp',
}

export const NODE_TYPE_DESCRIPTIONS: Record<WorkflowNodeType, string> = {
  greeting: 'Play welcome message (e.g. Namaste, PayAid se bol raha hun...)',
  intent: 'Classify what the caller wants: invoice, support, sales',
  crm_lookup: 'Find contact by phone in CRM',
  response: 'TTS response + quick replies',
  actions: 'Create deal, send WhatsApp, or transfer to human',
  end: 'End call or hand over to WhatsApp',
}

export function createDefaultWorkflow(): VoiceAgentWorkflow {
  return {
    nodes: [
      { id: 'greeting-1', type: 'greeting', data: { text: 'Namaste! PayAid se bol raha hun. Aapko kis tarah madad kar sakta hun?' }, position: { x: 0, y: 0 } },
      { id: 'intent-1', type: 'intent', data: { prompt: 'Classify: invoice enquiry, support, sales, or other' }, position: { x: 0, y: 80 } },
      { id: 'response-1', type: 'response', data: {}, position: { x: 0, y: 160 } },
      { id: 'end-1', type: 'end', data: {}, position: { x: 0, y: 240 } },
    ],
    edges: [
      { id: 'e1', source: 'greeting-1', target: 'intent-1' },
      { id: 'e2', source: 'intent-1', target: 'response-1' },
      { id: 'e3', source: 'response-1', target: 'end-1' },
    ],
  }
}

export function generateNodeId(type: WorkflowNodeType): string {
  return `${type}-${Date.now()}`
}
