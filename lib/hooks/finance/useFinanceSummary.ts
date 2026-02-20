'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'

export interface FinanceSummaryFilters {
  tenantId?: string
  period?: 'month' | 'quarter' | 'year'
}

export interface FinanceSummary {
  totalInvoices: number
  invoicesThisMonth: number
  invoicesLastMonth: number
  invoiceGrowth: number
  paidInvoices: number
  overdueInvoices: number
  overdueAmount: number
  pendingInvoices: number
  totalRevenue: number
  revenueThisMonth: number
  revenueLastMonth: number
  revenueGrowth: number
  totalExpenses: number
  expensesThisMonth: number
  profit: number
  profitMargin: number
  purchaseOrders: number
  purchaseOrdersThisMonth: number
  gstReports: number
  recentInvoices: Array<{ id: string; invoiceNumber: string; total: number; status: string; createdAt: string }>
  recentPurchaseOrders: Array<{ id: string; poNumber: string; total: number; status: string; createdAt: string }>
  monthlyRevenue: Array<{ month: string; revenue: number }>
  invoicesByStatus: Array<{ status: string; count: number; total: number }>
  arAging: { bucket0_30: number; bucket31_60: number; bucket60Plus: number }
  apAging: { dueToday: number; due7d: number; due30d: number }
  vendorsCount: number
  vendorsDueAmount: number
  gstInputCreditAvailable: number
  gstOutputDueThisMonth: number
  gstReconciliationPct: number
  cashPosition: number
  cashRunwayDays: number
  bankRecPct: number
  creditNotesCount: number
  debitNotesCount: number
}

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

/**
 * Single source of truth for Finance dashboard and list pages.
 * Same API as dashboard stats; use this hook so KPIs match everywhere.
 */
export function useFinanceSummary(filters: FinanceSummaryFilters) {
  const { tenantId, period = 'month' } = filters

  return useQuery({
    queryKey: ['finance-summary', tenantId, period],
    queryFn: async (): Promise<FinanceSummary> => {
      const params = new URLSearchParams()
      if (tenantId) params.set('tenantId', tenantId)
      const url = `/api/finance/dashboard/stats?${params}`
      const res = await fetch(url, { headers: getAuthHeaders() })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || err?.error || 'Failed to fetch finance summary')
      }
      const data = await res.json()
      return {
        totalInvoices: data.totalInvoices ?? 0,
        invoicesThisMonth: data.invoicesThisMonth ?? 0,
        invoicesLastMonth: data.invoicesLastMonth ?? 0,
        invoiceGrowth: data.invoiceGrowth ?? 0,
        paidInvoices: data.paidInvoices ?? 0,
        overdueInvoices: data.overdueInvoices ?? 0,
        overdueAmount: data.overdueAmount ?? 0,
        pendingInvoices: data.pendingInvoices ?? 0,
        totalRevenue: data.totalRevenue ?? 0,
        revenueThisMonth: data.revenueThisMonth ?? 0,
        revenueLastMonth: data.revenueLastMonth ?? 0,
        revenueGrowth: data.revenueGrowth ?? 0,
        totalExpenses: data.totalExpenses ?? 0,
        expensesThisMonth: data.expensesThisMonth ?? 0,
        profit: data.profit ?? 0,
        profitMargin: data.profitMargin ?? 0,
        purchaseOrders: data.purchaseOrders ?? 0,
        purchaseOrdersThisMonth: data.purchaseOrdersThisMonth ?? 0,
        gstReports: data.gstReports ?? 0,
        recentInvoices: Array.isArray(data.recentInvoices) ? data.recentInvoices : [],
        recentPurchaseOrders: Array.isArray(data.recentPurchaseOrders) ? data.recentPurchaseOrders : [],
        monthlyRevenue: Array.isArray(data.monthlyRevenue) ? data.monthlyRevenue : [],
        invoicesByStatus: Array.isArray(data.invoicesByStatus) ? data.invoicesByStatus : [],
        arAging: data.arAging ?? { bucket0_30: 0, bucket31_60: 0, bucket60Plus: 0 },
        apAging: data.apAging ?? { dueToday: 0, due7d: 0, due30d: 0 },
        vendorsCount: data.vendorsCount ?? 0,
        vendorsDueAmount: data.vendorsDueAmount ?? 0,
        gstInputCreditAvailable: data.gstInputCreditAvailable ?? 0,
        gstOutputDueThisMonth: data.gstOutputDueThisMonth ?? 0,
        gstReconciliationPct: data.gstReconciliationPct ?? 0,
        cashPosition: data.cashPosition ?? 0,
        cashRunwayDays: data.cashRunwayDays ?? 0,
        bankRecPct: data.bankRecPct ?? 0,
        creditNotesCount: data.creditNotesCount ?? 0,
        debitNotesCount: data.debitNotesCount ?? 0,
      }
    },
    enabled: !!tenantId,
  })
}
