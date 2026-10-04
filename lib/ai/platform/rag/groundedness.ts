/**
 * RAG groundedness + source trust checks (enterprise factual answers).
 */

import type { Citation } from '../runtime/schemas'

export type SourceTrustLevel = 'trusted' | 'internal' | 'unverified' | 'denied'

export interface GroundednessInput {
  answerText?: string
  retrievedChunks?: string[]
  citations?: Citation[]
  requireGrounding?: boolean
  sensitiveQuestion?: boolean
  minTrustForSensitive?: SourceTrustLevel
}

export interface GroundednessResult {
  allowed: boolean
  grounded: boolean
  confidence: 'low' | 'medium' | 'high'
  notes: string[]
  missingEvidence: string[]
  flags: string[]
  trustLevel: SourceTrustLevel
}

const TRUST_RANK: Record<SourceTrustLevel, number> = {
  denied: 0,
  unverified: 1,
  internal: 2,
  trusted: 3,
}

function maxTrust(citations?: Citation[]): SourceTrustLevel {
  if (!citations?.length) return 'unverified'
  let best: SourceTrustLevel = 'denied'
  for (const c of citations) {
    const level = (c.trustLevel || 'unverified') as SourceTrustLevel
    if (TRUST_RANK[level] > TRUST_RANK[best]) best = level
  }
  return best
}

function hasCitationMarkers(text: string): boolean {
  return /\[[0-9]+\]|\(source:|cited:|according to/i.test(text)
}

/**
 * Assess whether an answer is sufficiently grounded in retrieval context.
 * HR policy path is the reference pattern; this generalizes it.
 */
export function assessGroundedness(input: GroundednessInput): GroundednessResult {
  const notes: string[] = []
  const missingEvidence: string[] = []
  const flags: string[] = []
  const text = String(input.answerText || '').trim()
  const chunks = input.retrievedChunks || []
  const citations = input.citations || []
  const trustLevel = maxTrust(citations)
  const minTrust = input.minTrustForSensitive || 'internal'

  if (!text) {
    return {
      allowed: !input.requireGrounding,
      grounded: false,
      confidence: 'low',
      notes: ['No answer text to ground'],
      missingEvidence: ['answer'],
      flags: ['no_answer'],
      trustLevel,
    }
  }

  if (chunks.length === 0 && citations.length === 0) {
    missingEvidence.push('retrieval_context')
    notes.push('No retrieved chunks or citations supplied')
    if (input.requireGrounding || input.sensitiveQuestion) {
      flags.push('ungrounded_sensitive')
      return {
        allowed: false,
        grounded: false,
        confidence: 'low',
        notes,
        missingEvidence,
        flags,
        trustLevel,
      }
    }
    return {
      allowed: true,
      grounded: false,
      confidence: 'low',
      notes,
      missingEvidence,
      flags: ['ungrounded_ok_non_sensitive'],
      trustLevel,
    }
  }

  if (trustLevel === 'denied') {
    flags.push('denied_source')
    return {
      allowed: false,
      grounded: false,
      confidence: 'low',
      notes: ['Source trust level is denied'],
      missingEvidence: ['trusted_source'],
      flags,
      trustLevel,
    }
  }

  if (
    input.sensitiveQuestion &&
    TRUST_RANK[trustLevel] < TRUST_RANK[minTrust]
  ) {
    flags.push('low_trust_sensitive')
    notes.push(`Sensitive question requires >= ${minTrust} trust; got ${trustLevel}`)
    return {
      allowed: false,
      grounded: false,
      confidence: 'low',
      notes,
      missingEvidence: ['trusted_source'],
      flags,
      trustLevel,
    }
  }

  const cited = citations.length > 0 || hasCitationMarkers(text)
  if (!cited && (input.requireGrounding || input.sensitiveQuestion)) {
    flags.push('missing_citations')
    missingEvidence.push('citations')
    notes.push('Factual/sensitive answer missing citations')
    return {
      allowed: false,
      grounded: false,
      confidence: 'low',
      notes,
      missingEvidence,
      flags,
      trustLevel,
    }
  }

  // Lightweight overlap signal: at least one chunk token appears in answer
  let overlap = false
  if (chunks.length && text) {
    const answerLower = text.toLowerCase()
    overlap = chunks.some((chunk) => {
      const tokens = chunk
        .toLowerCase()
        .split(/\W+/)
        .filter((t) => t.length > 5)
        .slice(0, 12)
      return tokens.some((t) => answerLower.includes(t))
    })
    if (!overlap) {
      notes.push('Low lexical overlap with retrieved chunks')
      flags.push('low_overlap')
    }
  } else {
    overlap = citations.length > 0
  }

  const grounded = cited && (overlap || citations.length > 0)
  const confidence: 'low' | 'medium' | 'high' =
    grounded && trustLevel === 'trusted' ? 'high' : grounded ? 'medium' : 'low'

  if (!grounded && input.requireGrounding) {
    return {
      allowed: false,
      grounded: false,
      confidence,
      notes,
      missingEvidence: missingEvidence.length ? missingEvidence : ['grounding'],
      flags: [...flags, 'grounding_failed'],
      trustLevel,
    }
  }

  if (!grounded && trustLevel === 'unverified') {
    flags.push('low_trust_warning')
    notes.push('Low-trust sources used; treat answer as provisional')
  }

  return {
    allowed: true,
    grounded,
    confidence,
    notes,
    missingEvidence,
    flags,
    trustLevel,
  }
}
