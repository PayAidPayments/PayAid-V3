/**
 * Merge ordering: base → objections → tone → language → greeting (compliance) → training → KB → guidelines
 */

import { describe, it, expect } from '@jest/globals'
import {
  buildMergedSystemContext,
  VOICE_AGENT_OBJECTION_HANDLING,
} from '@/lib/voice-agent/agent-runtime-context'

describe('buildMergedSystemContext', () => {
  const baseAgent = {
    id: 'a1',
    tenantId: 't1',
    name: 'Acme',
    description: 'We sell widgets',
    language: 'en',
    voiceTone: 'professional',
    systemPrompt: 'You are a helpful agent.',
    workflow: { greeting: 'Hi, welcome to Acme' },
    compliance: { introText: 'This call may be recorded.' },
    knowledgeBase: null,
    functions: null,
  }

  it('places compliance inside opening via resolveGreeting before training sections', () => {
    const merged = buildMergedSystemContext(baseAgent, {
      trainingPackApproved: {
        bannedPhrases: ['absolutely guarantee'],
      },
    })
    const openingIdx = merged.indexOf('This call may be recorded')
    const bannedIdx = merged.indexOf('absolutely guarantee')
    expect(openingIdx).toBeGreaterThan(-1)
    expect(bannedIdx).toBeGreaterThan(openingIdx)
  })

  it('appends KB context after training pack sections', () => {
    const merged = buildMergedSystemContext(baseAgent, {
      trainingPackApproved: {
        notes: 'Say widget three times.',
      },
      kbContext: 'KB: price is 99',
    })
    const notesIdx = merged.indexOf('Trainer notes')
    const kbIdx = merged.indexOf('KB: price is 99')
    expect(notesIdx).toBeGreaterThan(-1)
    expect(kbIdx).toBeGreaterThan(notesIdx)
  })

  it('includes objection handling block from canonical export', () => {
    const merged = buildMergedSystemContext(baseAgent, {})
    expect(merged).toContain(VOICE_AGENT_OBJECTION_HANDLING.slice(0, 40))
  })
})
