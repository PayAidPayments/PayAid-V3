/**
 * Smart Invoice Merging Service
 * Analyzes invoices to suggest merge candidates and handle partial payments
 */

import { prisma } from '@/lib/db/prisma'

export interface MergeSuggestion {
  invoiceIds: string[]
  reason: string
  totalAmount: number
  totalPaid: number
  totalOutstanding: number
  confidence: number
}

/**
 * Get merge suggestions for invoices
 */
export async function getMergeSuggestions(
  tenantId: string,
  customerId?: string
): Promise<MergeSuggestion[]> {
  const where: any = {
    tenantId,
    status: { in: ['draft', 'sent'] },
  }

  if (customerId) {
    where.customerId = customerId
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const suggestions: MergeSuggestion[] = []

  // Group by customer
  const customerGroups = new Map<string, typeof invoices>()
  invoices.forEach((inv) => {
    const key = inv.customerId || 'no-customer'
    if (!customerGroups.has(key)) {
      customerGroups.set(key, [])
    }
    customerGroups.get(key)!.push(inv)
  })

  // Find merge candidates
  customerGroups.forEach((groupInvoices) => {
    if (groupInvoices.length < 2) return

    // Check for same customer, same date range
    const recentInvoices = groupInvoices.filter(
      (inv) => Date.now() - inv.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000
    )

    if (recentInvoices.length >= 2) {
      const totalAmount = recentInvoices.reduce((sum, inv) => sum + inv.total, 0)
      const totalPaid = recentInvoices.reduce(
        (sum, inv) => sum + (inv.paidAmount || 0),
        0
      )

      suggestions.push({
        invoiceIds: recentInvoices.map((inv) => inv.id),
        reason: `${recentInvoices.length} invoices for same customer within 7 days`,
        totalAmount,
        totalPaid,
        totalOutstanding: totalAmount - totalPaid,
        confidence: 0.8,
      })
    }

    // Check for small amounts that could be combined
    const smallInvoices = groupInvoices.filter((inv) => inv.total < 1000)
    if (smallInvoices.length >= 3) {
      const totalAmount = smallInvoices.reduce((sum, inv) => sum + inv.total, 0)
      const totalPaid = smallInvoices.reduce(
        (sum, inv) => sum + (inv.paidAmount || 0),
        0
      )

      suggestions.push({
        invoiceIds: smallInvoices.map((inv) => inv.id),
        reason: `${smallInvoices.length} small invoices (< ₹1000) for same customer`,
        totalAmount,
        totalPaid,
        totalOutstanding: totalAmount - totalPaid,
        confidence: 0.7,
      })
    }
  })

  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Handle partial payments in merge
 */
export function calculatePartialPayments(
  invoices: any[],
  totalPaid: number
): Record<string, number> {
  const allocations: Record<string, number> = {}
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0)

  // Allocate proportionally
  invoices.forEach((inv) => {
    const proportion = inv.total / totalAmount
    allocations[inv.id] = totalPaid * proportion
  })

  return allocations
}
