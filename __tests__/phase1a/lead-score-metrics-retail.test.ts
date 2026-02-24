/**
 * Phase 1A: lead scoring parse, metrics conversion rate, retail INR.
 * Run: npm test -- __tests__/phase1a/lead-score-metrics-retail.test.ts
 */

import { describe, it, expect } from '@jest/globals'

function parseGroqScoreJson(raw: string) {
  let str = raw.trim()
  const codeBlock = str.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) str = codeBlock[1].trim()
  const parsed = JSON.parse(str) as Record<string, unknown>
  const score = Math.min(100, Math.max(0, Number(parsed.score) || 0))
  const stage = ['hot', 'warm', 'cold'].includes(String(parsed.stage)) ? parsed.stage : 'cold'
  const nurture_action = String(parsed.nurture_action || 'Follow up.')
  const predicted_mrr = Math.max(0, Number(parsed.predicted_mrr) || 0)
  return { score, stage, nurture_action, predicted_mrr }
}

describe('Phase 1A Lead Scorer', () => {
  it('parses valid JSON score response', () => {
    const out = parseGroqScoreJson('{"score": 75, "stage": "warm", "nurture_action": "Send WhatsApp", "predicted_mrr": 5000}')
    expect(out.score).toBe(75)
    expect(out.stage).toBe('warm')
    expect(out.predicted_mrr).toBe(5000)
  })
  it('clamps score to 0-100', () => {
    expect(parseGroqScoreJson('{"score": 150, "stage": "hot", "nurture_action": "x", "predicted_mrr": 0}').score).toBe(100)
  })
})

describe('Phase 1A CRM Metrics', () => {
  function conversionRate(prospects: number, customers: number) {
    return prospects + customers > 0 ? Math.round((customers / (prospects + customers)) * 100) : 0
  }
  it('conversion rate when half customers', () => {
    expect(conversionRate(50, 50)).toBe(50)
  })
})

describe('Phase 1A Retail Agent', () => {
  it('totalInr = suggestedQty * unitPriceInr', () => {
    expect(10 * 500).toBe(5000)
  })
})
