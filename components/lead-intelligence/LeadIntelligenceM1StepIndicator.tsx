'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type M1StepId = 'search' | 'companies' | 'saved-searches' | 'exports'

const STEPS: Array<{ id: M1StepId; title: string; hrefSuffix: string }> = [
  { id: 'search', title: 'Plan', hrefSuffix: '/search' },
  { id: 'companies', title: 'Review', hrefSuffix: '/companies' },
  { id: 'saved-searches', title: 'Save', hrefSuffix: '/saved-searches' },
  { id: 'exports', title: 'Export', hrefSuffix: '/exports' },
]

export function LeadIntelligenceM1StepIndicator(props: {
  tenantId: string
  currentStep: M1StepId
  completedSteps?: M1StepId[]
  onResetProgress?: () => void
}) {
  const { tenantId, currentStep, completedSteps = [], onResetProgress } = props
  const completed = new Set<M1StepId>(completedSteps)
  const [resetMessageVisible, setResetMessageVisible] = useState(false)

  function handleReset() {
    onResetProgress?.()
    setResetMessageVisible(true)
    window.setTimeout(() => setResetMessageVisible(false), 1800)
  }

  return (
    <nav aria-label="Lead Intelligence M1 steps" className="rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ol className="flex flex-wrap gap-2 text-xs">
        {STEPS.map((step, idx) => {
          const isActive = step.id === currentStep
          const isDone = completed.has(step.id)
          return (
            <li key={step.id} className="flex items-center gap-2">
              <Link
                href={`/lead-intelligence/${tenantId}${step.hrefSuffix}`}
                className={cn(
                  'rounded-full px-2.5 py-1 border transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : isDone
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-muted/30 hover:bg-muted border-muted-foreground/20'
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {idx + 1}. {step.title}
                {isDone ? ' ✓' : ''}
              </Link>
              {idx < STEPS.length - 1 ? <span className="text-muted-foreground">→</span> : null}
            </li>
          )
        })}
        </ol>
        {onResetProgress ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Reset M1 progress
            </button>
            {resetMessageVisible ? (
              <span className="text-xs text-emerald-700">Progress reset</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </nav>
  )
}
