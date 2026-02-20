/**
 * Tax Calculator Tests
 */

import { describe, it, expect } from '@jest/globals'
import {
  calculateItemTax,
  calculateTotalTax,
  calculateGSTComponents,
} from '@/lib/tax/calculator'
import type { InvoiceLineItem, TaxRule } from '@/lib/tax/calculator'

describe('Tax Calculator', () => {
  const mockTaxRule: TaxRule = {
    id: '1',
    name: 'GST 18%',
    taxType: 'GST',
    rate: 18,
    isDefault: true,
  }

  const mockItem: InvoiceLineItem = {
    id: '1',
    name: 'Test Product',
    quantity: 2,
    unitPrice: 100,
    taxRuleId: '1',
    taxType: 'GST',
    taxRate: 18,
  }

  describe('calculateItemTax', () => {
    it('should calculate tax correctly', () => {
      const result = calculateItemTax(mockItem, mockTaxRule)
      expect(result.taxAmount).toBe(36) // 2 * 100 * 0.18
      expect(result.taxableAmount).toBe(200)
    })

    it('should return zero tax for exempt items', () => {
      const exemptItem = { ...mockItem, isExempt: true }
      const result = calculateItemTax(exemptItem, mockTaxRule)
      expect(result.taxAmount).toBe(0)
    })
  })

  describe('calculateTotalTax', () => {
    it('should calculate total tax for multiple items', () => {
      const items: InvoiceLineItem[] = [
        mockItem,
        { ...mockItem, id: '2', quantity: 1, unitPrice: 50 },
      ]
      const result = calculateTotalTax(items, [mockTaxRule])
      expect(result.totalTax).toBeGreaterThan(0)
    })
  })
})
