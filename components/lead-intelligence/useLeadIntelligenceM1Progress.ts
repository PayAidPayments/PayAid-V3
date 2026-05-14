'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export type LeadIntelligenceM1StepId = 'search' | 'companies' | 'saved-searches' | 'exports'

function getStorageKey(tenantId: string) {
  return `lead-intelligence:m1:progress:${tenantId}`
}

export function useLeadIntelligenceM1Progress(tenantId: string) {
  const [completed, setCompleted] = useState<LeadIntelligenceM1StepId[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !tenantId) return
    try {
      const raw = window.sessionStorage.getItem(getStorageKey(tenantId))
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const next = parsed.filter((v): v is LeadIntelligenceM1StepId =>
          v === 'search' || v === 'companies' || v === 'saved-searches' || v === 'exports'
        )
        setCompleted(Array.from(new Set(next)))
      }
    } catch {
      // ignore malformed session data
    }
  }, [tenantId])

  const markCompleted = useCallback(
    (...steps: LeadIntelligenceM1StepId[]) => {
      setCompleted((prev) => Array.from(new Set([...prev, ...steps])))
    },
    []
  )

  const resetProgress = useCallback(() => {
    setCompleted([])
    if (typeof window === 'undefined' || !tenantId) return
    try {
      window.sessionStorage.removeItem(getStorageKey(tenantId))
    } catch {
      // ignore storage errors
    }
  }, [tenantId])

  useEffect(() => {
    if (typeof window === 'undefined' || !tenantId) return
    try {
      window.sessionStorage.setItem(getStorageKey(tenantId), JSON.stringify(completed))
    } catch {
      // ignore storage errors
    }
  }, [tenantId, completed])

  const completedSteps = useMemo(() => Array.from(new Set(completed)), [completed])

  return { completedSteps, markCompleted, resetProgress }
}
