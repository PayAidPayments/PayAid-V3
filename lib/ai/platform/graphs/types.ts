/**
 * LangGraph workflow contracts — implement graphs when @langchain/langgraph is enabled.
 */

export type GraphNodeKind =
  | 'ingress'
  | 'plan'
  | 'validate'
  | 'tool'
  | 'approval'
  | 'reflect'
  | 'risk_check'
  | 'compose'
  | 'audit'

export interface GraphNodeDefinition {
  id: string
  kind: GraphNodeKind
  description: string
  requiresApproval?: boolean
}

export interface GraphWorkflowDefinition {
  id: string
  version: string
  nodes: GraphNodeDefinition[]
  edges: Array<{ from: string; to: string; condition?: string }>
  checkpointEnabled: boolean
}
