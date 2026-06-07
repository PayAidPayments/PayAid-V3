/**
 * Voice agent template library (blueprint Phase 2.1).
 * Presets for inbound support, sales, booking, reminders, and collections.
 */

import type { VoiceBehaviorConfig } from '@/lib/voice-agent/voice-behavior-config'
import { suggestVoiceBehaviorForPurpose } from '@/lib/voice-agent/voice-behavior-config'

export type VoiceAgentTemplateId =
  | 'inbound_support'
  | 'sales_qualification'
  | 'appointment_booking'
  | 'payment_reminder'
  | 'collections'

/** Maps to VoiceCreateAgentWorkspace `purpose` field. */
export type VoiceAgentTemplatePurpose = 'support' | 'sales' | 'booking' | 'surveys' | 'collections'

export type VoiceAgentTemplateObjections = {
  noMoney: string
  wrongNumber: string
  talkToBoss: string
}

export type VoiceAgentTemplateCrm = {
  logActivity: boolean
  autoCreateDeal: boolean
  whatsappFollowUp: boolean
  transferToHuman: boolean
}

export type VoiceAgentTemplate = {
  id: VoiceAgentTemplateId
  label: string
  description: string
  purpose: VoiceAgentTemplatePurpose
  defaultLanguage: string
  defaultVoiceId: string
  greeting: string
  objections: VoiceAgentTemplateObjections
  crm: VoiceAgentTemplateCrm
  voiceBehavior: Pick<VoiceBehaviorConfig, 'tonePreset' | 'pacePreset' | 'verbosityPreset'>
  /** Short operator note for Studio create flow. */
  operatorNote: string
}

export const VOICE_AGENT_TEMPLATES: VoiceAgentTemplate[] = [
  {
    id: 'inbound_support',
    label: 'Inbound support',
    description: 'Answer product questions, troubleshoot, and log support interactions.',
    purpose: 'support',
    defaultLanguage: 'hi',
    defaultVoiceId: 'divya-calm',
    greeting:
      'Namaste! PayAid support se bol raha hun. Aapki madad karta hun. Kya problem hai bataiye?',
    objections: {
      noMoney: 'Billing alag team dekhegi — pehle issue samajh lete hain.',
      wrongNumber: 'Maaf kijiye, galat number. Dhanyavaad.',
      talkToBoss: 'Senior agent callback schedule kar deta hun. Number confirm kijiye.',
    },
    crm: { logActivity: true, autoCreateDeal: false, whatsappFollowUp: true, transferToHuman: true },
    voiceBehavior: suggestVoiceBehaviorForPurpose('support'),
    operatorNote: 'Best for helpdesk overflow and after-hours support.',
  },
  {
    id: 'sales_qualification',
    label: 'Sales qualification',
    description: 'Qualify inbound or callback leads; capture intent and next step.',
    purpose: 'sales',
    defaultLanguage: 'hi',
    defaultVoiceId: 'arjun-warm',
    greeting:
      'Namaste! PayAid sales team se. Humare plans ke baare mein batana tha. Do minute dein?',
    objections: {
      noMoney: 'Samajhta hun. EMI ya starter plan option bata sakta hun.',
      wrongNumber: 'Sorry for the disturbance. Goodbye.',
      talkToBoss: 'Decision maker se baat ke liye callback time le leta hun.',
    },
    crm: { logActivity: true, autoCreateDeal: true, whatsappFollowUp: true, transferToHuman: false },
    voiceBehavior: suggestVoiceBehaviorForPurpose('sales'),
    operatorNote: 'Default Phase 1 spoken demo scenario.',
  },
  {
    id: 'appointment_booking',
    label: 'Appointment booking',
    description: 'Confirm slots, reschedule, and send calendar follow-ups.',
    purpose: 'booking',
    defaultLanguage: 'hi',
    defaultVoiceId: 'priya-calm',
    greeting: 'Namaste! PayAid se. Aapki appointment confirm karni thi. Kaunsa time suit karega?',
    objections: {
      noMoney: 'Booking free hai — sirf time confirm karna hai.',
      wrongNumber: 'Galat number lag gaya. Maaf kijiye.',
      talkToBoss: 'Manager ke calendar ke liye callback number note kar leta hun.',
    },
    crm: { logActivity: true, autoCreateDeal: false, whatsappFollowUp: true, transferToHuman: false },
    voiceBehavior: { tonePreset: 'calm_warm', pacePreset: 'normal', verbosityPreset: 'brief' },
    operatorNote: 'Use for demos, clinics, or field visit scheduling.',
  },
  {
    id: 'payment_reminder',
    label: 'Payment reminder',
    description: 'Friendly outbound reminder before due date; no collections pressure.',
    purpose: 'surveys',
    defaultLanguage: 'hi',
    defaultVoiceId: 'arjun-calm',
    greeting:
      'Namaste! PayAid se friendly reminder: aapka payment due date paas aa raha hai. Kya ab baat kar sakte hain?',
    objections: {
      noMoney: 'Samajhta hun. Extension ya partial payment option check karta hun.',
      wrongNumber: 'Record update kar lenge. Dhanyavaad.',
      talkToBoss: 'Accounts team callback arrange kar deta hun.',
    },
    crm: { logActivity: true, autoCreateDeal: false, whatsappFollowUp: false, transferToHuman: false },
    voiceBehavior: { tonePreset: 'calm_warm', pacePreset: 'normal', verbosityPreset: 'brief' },
    operatorNote: 'Softer than collections; use 3–5 days before due date.',
  },
  {
    id: 'collections',
    label: 'Collections follow-up',
    description: 'Overdue payment follow-up with promise-to-pay capture.',
    purpose: 'collections',
    defaultLanguage: 'hi',
    defaultVoiceId: 'arjun-formal',
    greeting:
      'Namaste! PayAid collections team bol raha hun. Aapka payment overdue hai. Ab resolve karna chahenge?',
    objections: {
      noMoney: 'Samajhta hun ji. EMI ya partial payment option dekhna chahenge?',
      wrongNumber: 'Maaf kijiye, galti se call. Goodbye.',
      talkToBoss: 'Ji, callback number de dijiye.',
    },
    crm: { logActivity: true, autoCreateDeal: false, whatsappFollowUp: false, transferToHuman: true },
    voiceBehavior: suggestVoiceBehaviorForPurpose('collections'),
    operatorNote: 'Requires finance compliance review before production dial.',
  },
]

export function getVoiceAgentTemplate(id: VoiceAgentTemplateId): VoiceAgentTemplate | undefined {
  return VOICE_AGENT_TEMPLATES.find((t) => t.id === id)
}

export function getVoiceAgentTemplateByPurpose(purpose: string): VoiceAgentTemplate | undefined {
  return VOICE_AGENT_TEMPLATES.find((t) => t.purpose === purpose)
}
