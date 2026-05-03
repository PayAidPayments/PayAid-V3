export type SpecialistActionLevel = 'read' | 'draft' | 'guarded_write' | 'restricted'

export interface SpecialistDefinition {
  id: string
  name: string
  promise: string
  modules: string[]
  allowedActionLevels: SpecialistActionLevel[]
  restrictedActions?: string[]
  promptChips: string[]
}

export interface SpecialistPolicyInput {
  specialistId: string
  module: string
  requestedActionLevel: SpecialistActionLevel
  userRoles: string[]
  userModules: string[]
}

export interface SpecialistPolicyResult {
  allowed: boolean
  reason?: string
  specialist?: SpecialistDefinition
}

export interface SpecialistAuditEvent {
  eventType:
    | 'specialist.requested'
    | 'specialist.permissions.checked'
    | 'specialist.response.completed'
    | 'specialist.response.failed'
    | 'specialist.action.blocked'
  specialistId: string
  specialistName: string
  module: string
  actionLevel: SpecialistActionLevel
  sessionId: string
  prompt: string
  permissionResult: 'granted' | 'denied'
  reason?: string
  contextSources?: string[]
  result?: 'success' | 'blocked' | 'error'
  latencyMs?: number
}

