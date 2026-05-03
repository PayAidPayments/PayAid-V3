/**
 * Currency Converter Tests
 */

import { describe, it, expect } from '@jest/globals'
import {
  getCurrencyInfo,
  formatCurrency,
  convertCurrency,
  fetchExchangeRate,
} from '@/lib/currency/converter'

describe('Currency Converter', () => {
  describe('getCurrencyInfo', () => {
    it('should return currency info for valid code', () => {
      const info = getCurrencyInfo('USD')
      expect(info).toBeDefined()
      expect(info?.code).toBe('USD')
      expect(info?.symbol).toBe('$')
    })

    it('should return null for invalid code', () => {
      const info = getCurrencyInfo('XXX')
      expect(info).toBeNull()
    })
  })

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      const formatted = formatCurrency(1234.56, 'USD')
      expect(formatted).toBe('$1234.56')
    })

    it('should format INR correctly', () => {
      const formatted = formatCurrency(1234.56, 'INR')
      expect(formatted).toBe('₹1234.56')
    })
  })

  describe('convertCurrency', () => {
    it('should return same amount for same currency', () => {
      const result = convertCurrency(100, 'USD', 'USD', 1)
      expect(result).toBe(100)
    })

    it('should convert correctly with exchange rate', () => {
      const result = convertCurrency(100, 'USD', 'INR', 83.5)
      expect(result).toBe(8350)
    })
  })
})
