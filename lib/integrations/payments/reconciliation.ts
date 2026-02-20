/**
 * Payment Reconciliation
 * Matches payments from gateway with invoices in PayAid
 */

import 'server-only'
import { prisma } from '@/lib/db/prisma'

export interface PaymentMatch {
  invoiceId: string
  invoiceNumber: string
  paymentId: string
  amount: number
  status: 'matched' | 'partial' | 'overpaid' | 'unmatched'
  confidence: number // 0-100
}

export interface ReconciliationResult {
  matched: PaymentMatch[]
  unmatched: Array<{ paymentId: string; amount: number; reason: string }>
  discrepancies: Array<{ invoiceId: string; expected: number; received: number }>
}

/**
 * Reconcile payments from Razorpay with PayAid invoices
 */
export async function reconcilePayments(
  tenantId: string,
  payments: Array<{
    id: string
    amount: number
    currency: string
    status: string
    invoiceId?: string
    notes?: Record<string, string>
    createdAt: Date
  }>
): Promise<ReconciliationResult> {
  const matched: PaymentMatch[] = []
  const unmatched: Array<{ paymentId: string; amount: number; reason: string }> = []
  const discrepancies: Array<{ invoiceId: string; expected: number; received: number }> = []

  for (const payment of payments) {
    // Try to match by invoice ID in notes
    let invoiceId = payment.invoiceId
    if (!invoiceId && payment.notes) {
      invoiceId = payment.notes.invoice_id || payment.notes.invoiceId
    }

    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId, tenantId },
      })

      if (invoice) {
        const invoiceTotal = Number(invoice.total || 0)
        const paymentAmount = payment.amount / 100 // Convert from paise

        if (Math.abs(invoiceTotal - paymentAmount) < 0.01) {
          // Exact match
          matched.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber || '',
            paymentId: payment.id,
            amount: paymentAmount,
            status: 'matched',
            confidence: 100,
          })

          // Update invoice payment status
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              paymentStatus: 'paid',
              paidAt: payment.createdAt,
            },
          })
        } else if (paymentAmount < invoiceTotal) {
          // Partial payment
          matched.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber || '',
            paymentId: payment.id,
            amount: paymentAmount,
            status: 'partial',
            confidence: 90,
          })
        } else {
          // Overpaid
          matched.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber || '',
            paymentId: payment.id,
            amount: paymentAmount,
            status: 'overpaid',
            confidence: 85,
          })
          discrepancies.push({
            invoiceId: invoice.id,
            expected: invoiceTotal,
            received: paymentAmount,
          })
        }
      } else {
        unmatched.push({
          paymentId: payment.id,
          amount: payment.amount / 100,
          reason: 'Invoice not found',
        })
      }
    } else {
      // Try fuzzy matching by amount and date
      const invoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          status: 'sent',
          paymentStatus: { not: 'paid' },
          invoiceDate: {
            gte: new Date(payment.createdAt.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before
            lte: new Date(payment.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after
          },
        },
      })

      const paymentAmount = payment.amount / 100
      const matchingInvoice = invoices.find(
        (inv) => Math.abs(Number(inv.total || 0) - paymentAmount) < 0.01
      )

      if (matchingInvoice) {
        matched.push({
          invoiceId: matchingInvoice.id,
          invoiceNumber: matchingInvoice.invoiceNumber || '',
          paymentId: payment.id,
          amount: paymentAmount,
          status: 'matched',
          confidence: 70, // Lower confidence for fuzzy match
        })

        await prisma.invoice.update({
          where: { id: matchingInvoice.id },
          data: {
            paymentStatus: 'paid',
            paidAt: payment.createdAt,
          },
        })
      } else {
        unmatched.push({
          paymentId: payment.id,
          amount: paymentAmount,
          reason: 'No matching invoice found',
        })
      }
    }
  }

  return { matched, unmatched, discrepancies }
}

/**
 * Get reconciliation report
 */
export async function getReconciliationReport(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalPayments: number
  matchedPayments: number
  unmatchedPayments: number
  totalAmount: number
  matchedAmount: number
  unmatchedAmount: number
}> {
  // This would query actual payment records
  // For now, return placeholder
  return {
    totalPayments: 0,
    matchedPayments: 0,
    unmatchedPayments: 0,
    totalAmount: 0,
    matchedAmount: 0,
    unmatchedAmount: 0,
  }
}
