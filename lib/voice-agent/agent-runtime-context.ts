import type { TrainingPackApprovedSnapshot } from './training-pack-types'
import { resolveGreeting } from '@/lib/voice-agent/runtime/bolna'
import type { VoiceAgentRow } from '@/lib/voice-agent/runtime/types'
import {
  hasSavedVoiceBehavior,
  parseVoiceBehaviorFromWorkflow,
  voiceBehaviorPromptBlock,
} from '@/lib/voice-agent/voice-behavior-config'

export type { TrainingPackApprovedSnapshot } from './training-pack-types'

/** Same objection block as Bolna runtime (keep in sync with bolna.ts OBJECTION_HANDLING). */
export const VOICE_AGENT_OBJECTION_HANDLING = `
MUST handle objections professionally:
- "No money" / "Paise nahi hai": Offer EMI. "Samajhta hun. Kya EMI option dekhna chahenge?"
- "Wrong number" / "Galat number": Apologise and end. "Maaf kijiye galti se call aayi."
- "Talk to boss" / "Boss se baat karo": Take callback. "Theek hai ji. Callback number de dijiye?"
ALWAYS: Polite, professional; concise for voice.
`.trim()

const LANGUAGE_NAMES: Record<string, string> = {
  hi: 'Hindi',
  en: 'English',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  mr: 'Marathi',
  gu: 'Gujarati',
  pa: 'Punjabi',
  bn: 'Bengali',
  ml: 'Malayalam',
}

export type VoiceAgentRuntimeInput = Pick<
  VoiceAgentRow,
  | 'id'
  | 'tenantId'
  | 'name'
  | 'description'
  | 'language'
  | 'voiceTone'
  | 'systemPrompt'
  | 'workflow'
  | 'knowledgeBase'
  | 'functions'
  | 'compliance'
>

export type BuildMergedSystemContextOptions = {
  /** Retrieved knowledge snippets for this turn (demo / injected context). */
  kbContext?: string
  /** Approved training pack only; draft must not affect production-aligned merge. */
  trainingPackApproved?: TrainingPackApprovedSnapshot | null
}

/**
 * Builds full system prompt text. Order: base prompt → objections → tone → language →
 * opening (includes compliance via resolveGreeting) → tools hint → training pack → KB → voice guidelines.
 */
export function buildMergedSystemContext(
  agent: VoiceAgentRuntimeInput,
  options: BuildMergedSystemContextOptions = {},
): string {
  const kbContext = options.kbContext?.trim() ?? ''
  const trainingPackApproved = options.trainingPackApproved ?? null

  let prompt = agent.systemPrompt.trim()
  prompt += `\n\n${VOICE_AGENT_OBJECTION_HANDLING}`

  const voiceBehavior = parseVoiceBehaviorFromWorkflow(agent.workflow)
  if (hasSavedVoiceBehavior(agent.workflow)) {
    prompt += `\n\n${voiceBehaviorPromptBlock(voiceBehavior)}`
  } else if (agent.voiceTone) {
    prompt += `\n\nTone: ${agent.voiceTone}.`
  }

  const lang = (agent.language || 'en').toLowerCase()
  const langName = LANGUAGE_NAMES[lang] || 'English'
  prompt += `\n\nYou are speaking in ${langName}. Respond naturally in ${langName}.`

  const rowForGreeting: VoiceAgentRow = {
    id: agent.id,
    tenantId: agent.tenantId,
    name: agent.name,
    description: agent.description,
    language: agent.language,
    voiceTone: agent.voiceTone,
    systemPrompt: agent.systemPrompt,
    status: 'active',
    workflow: agent.workflow,
    compliance: agent.compliance,
    knowledgeBase: agent.knowledgeBase,
    functions: agent.functions,
  }
  const greeting = resolveGreeting(rowForGreeting)
  prompt += `\n\nOpening message (match this spirit when greeting; stay consistent): ${greeting}`

  if (agent.functions && typeof agent.functions === 'object') {
    const tools = (agent.functions as { tools?: unknown }).tools
    if (Array.isArray(tools) && tools.length > 0) {
      prompt += `\n\nActions/tools are configured for this agent. In text-only demo you cannot execute them; describe what you would do or ask clarifying questions. On phone, tools run via the platform.`
    }
  }

  if (trainingPackApproved) {
    if (trainingPackApproved.bannedPhrases?.length) {
      prompt += `\n\nNever use these phrases or close variants:\n${trainingPackApproved.bannedPhrases.map((p) => `- ${p}`).join('\n')}`
    }
    if (trainingPackApproved.goodBadExamples?.length) {
      prompt += `\n\nAnswer quality examples (prefer "good", avoid "bad"):`
      for (const ex of trainingPackApproved.goodBadExamples) {
        prompt += `\n\nScenario: ${ex.scenario ?? '(general)'}\nGood: ${ex.good}\nBad: ${ex.bad}`
        if (ex.why?.trim()) prompt += `\nWhy bad: ${ex.why.trim()}`
      }
    }
    if (trainingPackApproved.sampleConversations?.length) {
      prompt += `\n\nReference style from sample conversations:`
      for (const s of trainingPackApproved.sampleConversations) {
        prompt += `\n\nUser: ${s.user}\nAssistant: ${s.assistant}`
      }
    }
    if (trainingPackApproved.objections?.length) {
      prompt += `\n\nAdditional objection handling:\n${trainingPackApproved.objections.map((o) => `- If ${o.trigger}: ${o.response}`).join('\n')}`
    }
    if (trainingPackApproved.escalations?.length) {
      prompt += `\n\nEscalation rules:\n${trainingPackApproved.escalations.map((e) => `- When ${e.when}: ${e.action}`).join('\n')}`
    }
    if (trainingPackApproved.notes?.trim()) {
      prompt += `\n\nTrainer notes:\n${trainingPackApproved.notes.trim()}`
    }
  }

  if (kbContext) {
    prompt += `\n\nRelevant context:\n${kbContext}`
  }

  prompt += `\n\nKeep responses concise and natural, suitable for voice conversation.`
  prompt += `\nUse everyday modern speech. Avoid archaic, bookish, or overly formal wording.`

  return prompt
}
