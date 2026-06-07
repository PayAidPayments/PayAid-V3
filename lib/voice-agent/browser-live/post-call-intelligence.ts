/**
 * Post-call intelligence helpers (sentiment, objection tags).
 */

import { analyzeSentiment, type SentimentResult } from '@/lib/voice-agent/sentiment-analysis'
import { parseTranscriptJson } from '@/lib/voice-agent/demo-transcript'

export type PostCallSentiment = Pick<SentimentResult, 'sentiment' | 'score' | 'confidence'>

const OBJECTION_PATTERNS: { tag: string; patterns: RegExp[] }[] = [
  { tag: 'price_objection', patterns: [/too expensive/i, /price/i, /cost/i, /mahnga/i, /mehnga/i] },
  { tag: 'payment_objection', patterns: [/no money/i, /can't pay/i, /cannot pay/i, /paise nahi/i] },
  { tag: 'wrong_number', patterns: [/wrong number/i, /galat number/i, /not me/i] },
  {
    tag: 'escalation_request',
    patterns: [/talk to(?:\s+\w+){0,2}\s+(?:boss|manager|supervisor)/i, /senior/i, /supervisor/i],
  },
  { tag: 'not_interested', patterns: [/not interested/i, /don't call/i, /stop calling/i, /interest nahi/i] },
  { tag: 'callback_requested', patterns: [/call (?:me )?back/i, /callback/i, /baad mein/i] },
]

export function analyzeTranscriptSentiment(transcriptJson: unknown): PostCallSentiment {
  const turns = parseTranscriptJson(transcriptJson)
  const userText = turns
    .filter((t) => t.role === 'user')
    .map((t) => t.content)
    .join(' ')
    .trim()
  if (!userText) {
    return { sentiment: 'neutral', score: 0, confidence: 0 }
  }
  const result = analyzeSentiment(userText)
  return {
    sentiment: result.sentiment,
    score: result.score,
    confidence: result.confidence,
  }
}

export function extractObjectionTags(transcriptJson: unknown): string[] {
  const turns = parseTranscriptJson(transcriptJson)
  const userText = turns
    .filter((t) => t.role === 'user')
    .map((t) => t.content)
    .join(' ')
    .trim()
  if (!userText) return []

  const tags: string[] = []
  for (const { tag, patterns } of OBJECTION_PATTERNS) {
    if (patterns.some((p) => p.test(userText))) tags.push(tag)
  }
  return tags
}
