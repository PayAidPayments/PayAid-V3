'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'

export interface HRSummaryFilters {
  tenantId?: string
  period?: 'month' | 'quarter' | 'year'
}

export interface HRSummary {
  headcount: number
  contractors: number
  turnover: number
  absentToday: number
  nextPayroll: string
  nextPayrollAmount: number
  complianceScore: number
  pendingReimbursements: number
  pendingReimbursementsAmount: number
  arrears: number
  avgEngagement: number
  okrCompletion: number
  trainingDue: number
  flightRisks?: Array<{ name: string; risk: number; reason: string }>
  hiringVelocity?: number
  overtimeRisk?: { team: string; risk: number }
  healthScore?: number
  healthScoreChange?: number
  aiInsights?: Array<{ text: string; impact: string }>
  attritionTrend?: Array<{ month: string; rate: number }>
  hiringVelocityTrend?: Array<{ month: string; days: number }>
  payrollCostTrend?: Array<{ month: string; cost: number }>
}

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

/**
 * Single source of truth for HR dashboard and list pages.
 * Same API as dashboard stats; use this hook so KPIs match everywhere.
 */
export function useHRSummary(filters: HRSummaryFilters) {
  const { tenantId, period = 'month' } = filters

  return useQuery({
    queryKey: ['hr-summary', tenantId, period],
    queryFn: async (): Promise<HRSummary> => {
      const params = new URLSearchParams()
      if (tenantId) params.set('tenantId', tenantId)
      const url = `/api/hr/summary?${params}`
      const res = await fetch(url, { headers: getAuthHeaders() })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || err?.error || 'Failed to fetch HR summary')
      }
      const data = await res.json()
      return {
        headcount: data.headcount ?? 0,
        contractors: data.contractors ?? 0,
        turnover: data.turnover ?? 0,
        absentToday: data.absentToday ?? 0,
        nextPayroll: data.nextPayroll ?? '',
        nextPayrollAmount: data.nextPayrollAmount ?? 0,
        complianceScore: data.complianceScore ?? 0,
        pendingReimbursements: data.pendingReimbursements ?? 0,
        pendingReimbursementsAmount: data.pendingReimbursementsAmount ?? 0,
        arrears: data.arrears ?? 0,
        avgEngagement: data.avgEngagement ?? 0,
        okrCompletion: data.okrCompletion ?? 0,
        trainingDue: data.trainingDue ?? 0,
        flightRisks: Array.isArray(data.flightRisks) ? data.flightRisks : [],
        hiringVelocity: data.hiringVelocity,
        overtimeRisk: data.overtimeRisk,
        healthScore: data.healthScore ?? 78,
        healthScoreChange: data.healthScoreChange ?? 0,
        aiInsights: Array.isArray(data.aiInsights) ? data.aiInsights : [],
        attritionTrend: Array.isArray(data.attritionTrend) ? data.attritionTrend : [],
        hiringVelocityTrend: Array.isArray(data.hiringVelocityTrend) ? data.hiringVelocityTrend : [],
        payrollCostTrend: Array.isArray(data.payrollCostTrend) ? data.payrollCostTrend : [],
      }
    },
    enabled: !!tenantId,
  })
}
