import type { IngressClassification, IntentClass, RiskClass, SensitivityClass } from '../types'

const ACTION_PHRASES = [
  'send email',
  'delete',
  'transfer',
  'payment',
  'refund',
  'approve',
  'execute',
  'deploy',
  'update config',
]

const SENSITIVE_PHRASES = ['ssn', 'aadhaar', 'pan card', 'password', 'api key', 'bank account']

export function classifyAiInput(text: string): IngressClassification {
  const lower = text.toLowerCase()
  const labels: string[] = []
  let intent: IntentClass = 'unknown'
  let sensitivity: SensitivityClass = 'internal'
  let risk: RiskClass = 'low'

  if (ACTION_PHRASES.some((p) => lower.includes(p))) {
    intent = 'action_request'
    labels.push('action_oriented')
    risk = 'medium'
  } else if (lower.includes('summarize') || lower.includes('analyze') || lower.includes('report')) {
    intent = 'analytical'
  } else if (lower.includes('draft') || lower.includes('write') || lower.includes('compose')) {
    intent = 'draft_content'
  } else if (lower.includes('what is') || lower.includes('how do') || lower.includes('explain')) {
    intent = 'informational'
  }

  if (SENSITIVE_PHRASES.some((p) => lower.includes(p))) {
    sensitivity = 'confidential'
    risk = elevateRisk(risk)
    labels.push('sensitive_data_hint')
  }

  if (lower.includes('ignore instructions') || lower.includes('system prompt')) {
    risk = 'critical'
    labels.push('injection_hint')
  }

  return {
    intent,
    sensitivity,
    risk,
    // `workflow_trigger` is part of IntentClass for downstream classifiers; this
    // ingress path only emits `action_request` for action-oriented prompts today.
    actionOriented: intent === 'action_request',
    labels,
  }
}

function elevateRisk(current: RiskClass): RiskClass {
  if (current === 'low') return 'medium'
  if (current === 'medium') return 'high'
  return 'critical'
}
