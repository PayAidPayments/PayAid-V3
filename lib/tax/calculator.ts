/**
 * Tax Calculation Service
 * Handles flexible tax calculations with per-item tax, multiple tax types
 */

export interface TaxRule {
  id: string
  name: string
  taxType: 'GST' | 'VAT' | 'SALES_TAX' | 'CUSTOM'
  rate: number // Percentage (e.g., 18.0 for 18%)
  isDefault?: boolean
  appliesTo?: 'all' | 'products' | 'services' | 'specific'
  productIds?: string[]
  customerIds?: string[]
  isExempt?: boolean
  exemptionReason?: string
}

export interface TaxCalculation {
  taxType: string
  rate: number
  taxableAmount: number
  taxAmount: number
  breakdown?: TaxBreakdown[]
}

export interface TaxBreakdown {
  itemId?: string
  itemName?: string
  taxableAmount: number
  taxRate: number
  taxAmount: number
  taxType: string
}

export interface InvoiceLineItem {
  id?: string
  name: string
  quantity: number
  unitPrice: number
  taxRuleId?: string
  taxType?: string
  taxRate?: number
  isExempt?: boolean
}

/**
 * Calculate tax for a single line item
 */
export function calculateItemTax(
  item: InvoiceLineItem,
  taxRules: TaxRule[],
  customerId?: string
): TaxCalculation {
  let applicableRule: TaxRule | null = null

  // Find applicable tax rule
  if (item.taxRuleId) {
    applicableRule = taxRules.find((r) => r.id === item.taxRuleId) || null
  } else if (item.taxType && item.taxRate !== undefined) {
    // Use inline tax specification
    return {
      taxType: item.taxType,
      rate: item.taxRate,
      taxableAmount: item.quantity * item.unitPrice,
      taxAmount: (item.quantity * item.unitPrice * item.taxRate) / 100,
    }
  } else {
    // Find default rule or rule that applies to this item
    applicableRule =
      taxRules.find((r) => r.isDefault && r.isActive) ||
      taxRules.find((r) => r.appliesTo === 'all' && r.isActive) ||
      null
  }

  if (!applicableRule || applicableRule.isExempt || item.isExempt) {
    return {
      taxType: 'EXEMPT',
      rate: 0,
      taxableAmount: item.quantity * item.unitPrice,
      taxAmount: 0,
    }
  }

  const taxableAmount = item.quantity * item.unitPrice
  const taxAmount = (taxableAmount * applicableRule.rate) / 100

  return {
    taxType: applicableRule.taxType,
    rate: applicableRule.rate,
    taxableAmount,
    taxAmount,
  }
}

/**
 * Calculate total tax for multiple line items
 * Supports multiple tax types (GST + VAT + Sales Tax)
 */
export function calculateTotalTax(
  items: InvoiceLineItem[],
  taxRules: TaxRule[],
  customerId?: string
): {
  totalTax: number
  taxBreakdown: TaxBreakdown[]
  taxByType: Record<string, number>
} {
  const taxBreakdown: TaxBreakdown[] = []
  const taxByType: Record<string, number> = {}

  for (const item of items) {
    const taxCalc = calculateItemTax(item, taxRules, customerId)

    if (taxCalc.taxAmount > 0) {
      taxBreakdown.push({
        itemId: item.id,
        itemName: item.name,
        taxableAmount: taxCalc.taxableAmount,
        taxRate: taxCalc.rate,
        taxAmount: taxCalc.taxAmount,
        taxType: taxCalc.taxType,
      })

      // Aggregate by tax type
      if (!taxByType[taxCalc.taxType]) {
        taxByType[taxCalc.taxType] = 0
      }
      taxByType[taxCalc.taxType] += taxCalc.taxAmount
    }
  }

  const totalTax = Object.values(taxByType).reduce((sum, amount) => sum + amount, 0)

  return {
    totalTax,
    taxBreakdown,
    taxByType,
  }
}

/**
 * Calculate GST components (CGST, SGST, IGST)
 */
export function calculateGSTComponents(
  taxableAmount: number,
  gstRate: number,
  isInterState: boolean
): {
  cgst: number
  sgst: number
  igst: number
  totalGST: number
} {
  const totalGST = (taxableAmount * gstRate) / 100

  if (isInterState) {
    // IGST for interstate
    return {
      cgst: 0,
      sgst: 0,
      igst: totalGST,
      totalGST,
    }
  } else {
    // CGST + SGST for intrastate
    const cgst = totalGST / 2
    const sgst = totalGST / 2
    return {
      cgst,
      sgst,
      igst: 0,
      totalGST,
    }
  }
}

/**
 * Get applicable tax rules for a customer/product
 */
export function getApplicableTaxRules(
  taxRules: TaxRule[],
  customerId?: string,
  productId?: string
): TaxRule[] {
  return taxRules.filter((rule) => {
    if (!rule.isActive) return false
    if (rule.isExempt) return true // Exemption rules always apply

    // Check customer-specific rules
    if (rule.customerIds && rule.customerIds.length > 0) {
      if (!customerId || !rule.customerIds.includes(customerId)) {
        return false
      }
    }

    // Check product-specific rules
    if (rule.appliesTo === 'specific' && rule.productIds && rule.productIds.length > 0) {
      if (!productId || !rule.productIds.includes(productId)) {
        return false
      }
    }

    // Check appliesTo
    if (rule.appliesTo === 'all') return true
    // Additional logic for 'products' vs 'services' can be added here

    return true
  })
}
