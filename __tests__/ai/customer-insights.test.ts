/**
 * Customer Insights Tests
 */

import { describe, it, expect } from '@jest/globals'
import {
  calculateHealthScore,
  calculateEngagementScore,
  calculatePaymentScore,
  predictChurnRisk,
} from '@/lib/ai/customer-insights'
import type { CustomerInsightData } from '@/lib/ai/customer-insights'

describe('Customer Insights', () => {
  const mockData: CustomerInsightData = {
    contactId: '1',
    tenantId: '1',
    invoices: [],
    interactions: [],
    tickets: [],
  }

  describe('calculateHealthScore', () => {
    it('should return a score between 0 and 100', () => {
      const score = calculateHealthScore(mockData)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe('calculateEngagementScore', () => {
    it('should return a score between 0 and 100', () => {
      const score = calculateEngagementScore(mockData)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe('predictChurnRisk', () => {
    it('should return a risk level', () => {
      const result = predictChurnRisk(mockData)
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel)
      expect(result.risk).toBeGreaterThanOrEqual(0)
      expect(result.risk).toBeLessThanOrEqual(100)
    })
  })
})
