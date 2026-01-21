/**
 * Finance Module Types - Base Module
 * Shared across all industries
 */

import { z } from 'zod'

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'
export type PaymentMethod = 'payaid' | 'bank_transfer' | 'cash' | 'cheque' | 'upi'
export type PaymentTerms = 'immediate' | 'net15' | 'net30' | 'net45' | 'custom'
export type ExpenseCategory = 'office' | 'travel' | 'marketing' | 'utilities' | 'supplies' | 'other'
export type GSTReturnPeriod = 'monthly' | 'quarterly'
export type GSTReturnStatus = 'pending' | 'filed' | 'paid'

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number // In ₹
  taxRate: number // GST rate (0%, 5%, 12%, 18%, 28%)
  hsnCode?: string
  amount: number // In ₹
  taxAmount: number // In ₹
}

export interface TaxBreakdown {
  cgst: number // In ₹
  sgst: number // In ₹
  igst: number // In ₹
  totalTax: number // In ₹
  breakdownByRate: Record<string, number> // Rate -> Amount
}

export interface Invoice {
  id: string
  organizationId: string
  invoiceNumber: string
  invoiceDate: Date
  dueDate: Date
  customerId: string
  lineItems: LineItem[]
  subtotalINR: number // In ₹
  taxBreakdown: TaxBreakdown
  discountINR: number // In ₹
  totalINR: number // In ₹
  status: InvoiceStatus
  paymentTerms: PaymentTerms
  paymentMethod?: PaymentMethod
  paymentLink?: string // PayAid Payments link
  payments: Payment[]
  notes: string
  isRecurring?: boolean
  recurringInterval?: 'monthly' | 'quarterly' | 'annual'
  industrySpecificFields?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number // In ₹
  paymentDate: Date
  paymentMethod: PaymentMethod
  transactionId?: string // PayAid transaction ID
  notes?: string
}

export interface Expense {
  id: string
  organizationId: string
  description: string
  amountINR: number // In ₹
  category: ExpenseCategory
  paymentMethod: PaymentMethod
  vendor?: string
  receiptAttachment?: string
  isRecurring: boolean
  allocationToInvoice?: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  createdAt: Date
}

export interface GSTReturn {
  id: string
  organizationId: string
  period: GSTReturnPeriod
  filingDeadline: Date
  invoicesSummary: {
    totalTaxableValue: number // In ₹
    totalGSTCollected: number // In ₹
    gstBreakdownBySlab: Record<string, number> // Rate -> Amount
  }
  expenseSummary: {
    totalInputGST: number // In ₹
  }
  netGSTPayableINR: number // In ₹
  filedAt?: Date
  filedUrl?: string
  status: GSTReturnStatus
}

// Validation schemas
export const CreateInvoiceSchema = z.object({
  organizationId: z.string().uuid(),
  customerId: z.string().uuid(),
  invoiceDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  lineItems: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      taxRate: z.number().min(0).max(28),
      hsnCode: z.string().optional(),
    })
  ),
  discountINR: z.number().nonnegative().default(0),
  paymentTerms: z.enum(['immediate', 'net15', 'net30', 'net45', 'custom']).default('net30'),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(['monthly', 'quarterly', 'annual']).optional(),
})

export const CreateExpenseSchema = z.object({
  organizationId: z.string().uuid(),
  description: z.string().min(1),
  amountINR: z.number().positive(),
  category: z.enum(['office', 'travel', 'marketing', 'utilities', 'supplies', 'other']),
  paymentMethod: z.enum(['payaid', 'bank_transfer', 'cash', 'cheque', 'upi']),
  vendor: z.string().optional(),
  receiptAttachment: z.string().optional(),
  isRecurring: z.boolean().default(false),
  allocationToInvoice: z.string().uuid().optional(),
})
